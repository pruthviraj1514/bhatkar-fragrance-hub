import { motion } from "framer-motion";
import { ArrowLeft, Package, Download, Loader2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  trackingNumber?: string;
  customerEmail?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  raw_order?: any;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400" },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" },
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/orders/my');
        const rawOrders = response.data?.data || [];

        // Map backend orders to frontend Order interface
        const mappedOrders: Order[] = rawOrders.map((o: any) => ({
          id: `ORD-${new Date(o.created_at).getFullYear()}-${String(o.id).padStart(3, '0')}`,
          date: o.created_at,
          total: Number(o.total_amount),
          status: o.status,
          items: [
            {
              id: String(o.product_id),
              name: o.product_name || 'Product',
              quantity: o.quantity || 1,
              price: Number(o.total_amount) / (o.quantity || 1),
              image: o.product_images && o.product_images[0]?.image_url
            }
          ],
          trackingNumber: o.razorpay_order_id,
          customerEmail: o.customer_email,
          firstName: o.firstName,
          lastName: o.lastName,
          address: o.address,
          city: o.city,
          state: o.state,
          postal_code: o.postal_code,
          country: o.country,
          phone: o.phone,
          raw_order: o
        }));

        setOrders(mappedOrders);
      } catch (error: any) {
        console.error('❌ Failed to fetch orders:', error);
        toast.error('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  const handleDownloadInvoice = async (order: Order) => {
    try {
      setDownloadingId(order.id);
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const lineHeight = 7;
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("INVOICE", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(order.id, margin, yPosition);
      yPosition += 12;

      // Company Info Section
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("FROM:", margin, yPosition);
      yPosition += 6;

      pdf.setFont(undefined, "normal");
      pdf.setFontSize(9);
      const companyLines = [
        "Bhatkar & Co",
        "Fine Perfumery",
        "R102, Moregaon 90 Feet Road",
        "Nalasopara East, Mumbai – 401209",
        "Maharashtra, India",
        "+91 98765 43210",
        "info@bhatkarcco.com"
      ];

      companyLines.forEach((line) => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Customer Info (right side)
      yPosition = 32;
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("BILL TO:", pageWidth / 2, yPosition);
      yPosition += 6;

      pdf.setFont(undefined, "normal");
      pdf.setFontSize(9);
      const customerLines = [
        `${order.firstName || ""} ${order.lastName || ""}`,
        order.address || "",
        `${order.city || ""}, ${order.state || ""} ${order.postal_code || ""}`,
        order.country || "",
        order.phone || "",
        order.customerEmail || ""
      ];

      customerLines.forEach((line) => {
        if (line.trim()) {
          pdf.text(line, pageWidth / 2, yPosition);
          yPosition += 5;
        }
      });

      // Reset yPosition
      yPosition = 85;

      // Order Details
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.text("Invoice Date:", margin, yPosition);
      pdf.setFont(undefined, "normal");
      pdf.text(new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }), margin + 35, yPosition);

      yPosition += 7;
      pdf.setFont(undefined, "bold");
      pdf.text("Order ID:", margin, yPosition);
      pdf.setFont(undefined, "normal");
      pdf.text(order.id, margin + 35, yPosition);

      yPosition += 12;

      // Items Table Header
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 6);
      pdf.text("Description", margin + 2, yPosition);
      pdf.text("Qty", pageWidth / 2 + 20, yPosition);
      pdf.text("Unit Price", pageWidth / 2 + 50, yPosition);
      pdf.text("Total", pageWidth - margin - 15, yPosition);

      yPosition += 10;

      // Items
      pdf.setFont(undefined, "normal");
      order.items.forEach((item) => {
        const description = item.name;
        pdf.text(description.substring(0, 40), margin + 2, yPosition);
        pdf.text(String(item.quantity), pageWidth / 2 + 20, yPosition);
        pdf.text(formatPrice(item.price), pageWidth / 2 + 50, yPosition);
        pdf.text(formatPrice(item.price * item.quantity), pageWidth - margin - 15, yPosition);
        yPosition += 8;
      });

      // Totals Section
      yPosition += 5;
      pdf.setFont(undefined, "bold");
      pdf.line(pageWidth - margin - 40, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
      pdf.text("TOTAL AMOUNT:", pageWidth - margin - 40, yPosition);
      pdf.text(formatPrice(order.total), pageWidth - margin - 5, yPosition, { align: "right" });

      // Payment Status
      yPosition += 15;
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(9);
      pdf.text("Payment Status", margin, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(8);
      pdf.text(`Status: ${order.status}`, margin, yPosition);
      yPosition += 5;
      if (order.trackingNumber) {
        pdf.text(`Reference ID: ${order.trackingNumber}`, margin, yPosition);
      }

      // Footer
      yPosition = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, "normal");
      pdf.text("Thank you for your purchase!", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      pdf.text("If you have any questions, please contact us at info@bhatkarcco.com", pageWidth / 2, yPosition, { align: "center" });

      pdf.save(`invoice-${order.id}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-8 md:py-12 border-b border-border/50"
        >
          <div className="container">
            <Link
              to="/shop"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              My Orders
            </h1>
            <p className="text-muted-foreground mt-3">
              View your order history, tracking information, and invoices
            </p>
          </div>
        </motion.section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Fetching your orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-soft hover:shadow-medium transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Ordered on {new Date(order.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <Badge className={(statusConfig[order.status] || statusConfig.PENDING).color}>
                          {(statusConfig[order.status] || statusConfig.PENDING).label}
                        </Badge>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6 pb-6 border-b border-border/50">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                          {item.image && (
                            <div className="h-20 w-20 rounded bg-secondary flex-shrink-0 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Quantity: {item.quantity}
                            </p>
                            <p className="font-semibold text-primary">
                              {formatPrice(item.price)} per unit
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
                      <Button 
                        variant="outline" 
                        className="gap-2" 
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingId === order.id}
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === order.id ? "Generating..." : "Download Invoice"}
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="py-20 text-center"
              >
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-8">
                  Start shopping to create your first order
                </p>
                <Link to="/shop">
                  <Button>Browse Perfumes</Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
