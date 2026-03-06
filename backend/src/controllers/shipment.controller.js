const db = require('../config/db');
const shiprocket = require('../services/shiprocket.service');
const { logger } = require('../utils/logger');

// Helper to fetch order with user and product info
async function fetchOrder(orderId) {
  const q = `SELECT o.*, 
    u.email as customer_email, 
    CONCAT(u.firstname, ' ', u.lastname) as customer_name,
    u.phone as user_phone,
    p.name as product_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.id = $1`;
  const res = await db.query(q, [orderId]);
  return res.rows && res.rows[0] ? res.rows[0] : null;
}

async function createShipmentInternal(orderId) {
  logger.info(`[Shipment] Starting process for order ${orderId}`);
  
  const order = await fetchOrder(orderId);
  if (!order) {
    logger.error(`[Shipment] Order not found: ${orderId}`);
    throw new Error('Order not found');
  }

  if (order.shiprocket_order_id) {
    logger.warn(`[Shipment] Order ${orderId} already has shipment: ${order.shiprocket_order_id}`);
    return order;
  }

  const customerName = order.customer_name || order.customer_email || 'Customer';
  const itemName = order.product_name || `product-${order.product_id || ''}`;
  
  // Fetch phone number - priority: order.phone → order.user_phone → fallback to valid format
  // Shiprocket requires valid phone format (10 digits for India)
  let phone = order.phone || order.shipping_phone || order.user_phone || '9359687277';
  phone = phone.replace(/\D/g, '').slice(-10) || '9359687277';

  logger.info(`[Shipment] Using phone ${phone.slice(-4)} for order ${orderId}`);

  // Extract customer shipping data from checkout form or use defaults
  const shippingCustomerName = order.first_name || 'Customer';
  const shippingLastName = order.last_name || 'Order';
  const shippingAddress = order.shipping_address || 'Address not provided';
  const shippingCity = order.shipping_city || 'Mumbai';
  const shippingPincode = order.shipping_pincode || '400001';
  const shippingState = order.shipping_state || 'Maharashtra';

  logger.info(`[Shipment] Using customer shipping info: ${shippingCustomerName} ${shippingLastName}, ${shippingAddress}, ${shippingCity}`);

  const payload = {
    order_id: `order_${order.id}`,
    order_date: new Date().toISOString(),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Default',
    comment: order.notes || 'Order shipment',

    // Billing Information (use customer name but keep company billing address)
    billing_customer_name: shippingCustomerName,
    billing_last_name: shippingLastName,
    billing_address: shippingAddress,
    billing_city: shippingCity,
    billing_pincode: shippingPincode,
    billing_state: shippingState,
    billing_country: 'IN',
    billing_email: order.customer_email || 'noreply@bhatkar.com',
    billing_phone: phone,

    // Shipping Information (use customer checkout data)
    shipping_is_billing: true,
    shipping_customer_name: shippingCustomerName,
    shipping_last_name: shippingLastName,
    shipping_address: shippingAddress,
    shipping_city: shippingCity,
    shipping_pincode: shippingPincode,
    shipping_state: shippingState,
    shipping_country: 'IN',
    shipping_email: order.customer_email || 'noreply@bhatkar.com',
    shipping_phone: phone,

    order_items: [
      {
        name: itemName,
        sku: `SKU-${order.product_id || order.id}`,
        units: order.quantity || 1,
        selling_price: parseFloat(order.total_amount) || 0
      }
    ],

    payment_method: 'Prepaid',
    sub_total: parseFloat(order.total_amount) || 0,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 500
  };

  logger.info(`[Shipment] Payload ready. Calling Shiprocket API...`, payload);
  
  const resp = await shiprocket.createShipment(payload);
  
  logger.info(`[Shipment] Shiprocket API responded:`, resp);
  
  const data = resp?.data || resp;

  const shiprocketOrderId = data?.order_id || null;
  const awb = data?.awb_code || null;
  const courier = data?.courier_company || null;
  const trackingUrl = data?.tracking_url || null;
  const shipmentStatus = data?.status || 'CREATED';

  const updateSql = `
    UPDATE orders 
    SET shiprocket_order_id=$1, awb_code=$2, courier_name=$3, tracking_url=$4, shipment_status=$5, updated_at=NOW()
    WHERE id=$6 RETURNING *
  `;

  logger.info(`[Shipment] Updating database for order ${orderId}...`);
  
  const updated = await db.query(updateSql, [
    shiprocketOrderId,
    awb,
    courier,
    trackingUrl,
    shipmentStatus,
    order.id
  ]);

  logger.info(`[Shipment] ✅ Created successfully:`, updated.rows[0]);
  
  return updated.rows[0];
}

async function createShipmentForOrder(req, res) {
  const orderId = parseInt(req.params.id || req.body.orderId, 10);

  // configuration guard – return 422 if credentials are missing
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    return res.status(422).json({
      status: "error",
      message: "Shiprocket credentials not configured"
    });
  }

  if (!orderId) {
    return res.status(400).json({
      status: "error",
      message: "order id required"
    });
  }

  try {
    logger.info(`Creating shipment for order ${orderId}...`);
    
    // Timeout this operation after 12 seconds to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Shipment creation timeout')), 12000)
    );
    
    const shipmentPromise = createShipmentInternal(orderId);
    const order = await Promise.race([shipmentPromise, timeoutPromise]);

    logger.info(`✅ Shipment created for order ${orderId}:`, order.shiprocket_order_id);
    
    return res.status(200).json({
      status: "ok",
      message: "Shipment processed",
      order
    });
  } catch (err) {
    logger.error("❌ createShipmentForOrder failed:", err.message || err);

    // if the underlying error was missing credentials, translate it to 422
    if (err.message && err.message.includes('SHIPROCKET_EMAIL')) {
      return res.status(422).json({
        status: "error",
        message: "Shiprocket credentials not configured"
      });
    }

    // timeout error
    if (err.message && err.message.includes('timeout')) {
      return res.status(504).json({
        status: "error",
        message: "Shipment creation timed out. Shiprocket may be unreachable."
      });
    }

    return res.status(500).json({
      status: "error",
      message: err.message || "Shiprocket error"
    });
  }
}

module.exports = {
  createShipmentForOrder,
  createShipmentInternal
};