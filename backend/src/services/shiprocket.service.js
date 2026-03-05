const axios = require('axios');
const logger = require('../utils/logger').logger || console;

const BASE = process.env.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in/v1/external';
const EMAIL = process.env.SHIPROCKET_EMAIL;
const PASSWORD = process.env.SHIPROCKET_PASSWORD;

let cached = {
  token: null,
  obtainedAt: 0,
  ttlMs: 10 * 60 * 1000 // refresh every 10 minutes
};

async function login() {
  if (!EMAIL || !PASSWORD) {
    const msg = 'SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set';
    logger.error(msg);
    throw new Error(msg);
  }

  // reuse token if fresh
  if (cached.token && (Date.now() - cached.obtainedAt) < cached.ttlMs) {
    return cached.token;
  }

  const url = `${BASE}/auth/login`;
  try {
    logger.info(`Attempting Shiprocket login at ${url}`);
    const resp = await axios.post(url, { email: EMAIL, password: PASSWORD }, { 
      timeout: 8000,
      validateStatus: () => true  // Don't throw on any status code
    });
    
    if (resp.status >= 400) {
      logger.error(`Shiprocket login failed: ${resp.status} ${resp.statusText}`, resp.data);
      throw new Error(`Shiprocket auth failed: ${resp.status} ${resp.statusText}`);
    }
    
    const token = resp?.data?.token || resp?.data?.data?.token || resp?.data?.access_token;
    if (!token) {
      logger.error('No token in Shiprocket response:', resp.data);
      throw new Error('No token returned from Shiprocket login');
    }
    cached.token = token;
    cached.obtainedAt = Date.now();
    logger.info('✅ Shiprocket: obtained new token');
    return token;
  } catch (err) {
    logger.error('❌ Shiprocket login failed:', err.message || err);
    throw err;
  }
}

async function createShipment(payload) {
  // payload should be the body expected by Shiprocket /orders/create/adhoc
  logger.info(`[Shiprocket] Fetching auth token...`);
  const token = await login();
  
  const url = `${BASE}/orders/create/adhoc`;
  logger.info(`[Shiprocket] Posting to ${url}`);
  
  try {
    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000,
      validateStatus: () => true  // Don't throw on any status code
    });
    
    logger.info(`[Shiprocket] Response status: ${resp.status}`);
    
    if (resp.status >= 400) {
      logger.error(`[Shiprocket] API returned error: ${resp.status}`, resp.data);
      throw new Error(`Shiprocket error: ${resp.status} ${JSON.stringify(resp.data)}`);
    }
    
    logger.info(`[Shiprocket] ✅ Shipment created successfully`);
    return resp.data;
  } catch (err) {
    // Invalidate token on 401 so next call will re-login
    if (err.response && err.response.status === 401) {
      cached.token = null;
    }
    logger.error('❌ Shiprocket createShipment failed:', err.message || err);
    throw err;
  }
}

module.exports = {
  login,
  createShipment
};
