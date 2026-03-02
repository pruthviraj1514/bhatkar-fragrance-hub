/**
 * IMAGE PROXY CONTROLLER
 * ======================
 * Fetches images from Supabase Storage via service role key and streams
 * them back to the browser. This eliminates direct browser → Supabase CDN
 * connections that produce ERR_CONNECTION_TIMED_OUT on some networks.
 *
 * Endpoint: GET /api/images/proxy/:filename
 *
 * Features:
 * - In-memory LRU cache (50 MB soft limit) – hot images served instantly
 * - Streams the response so Node never buffers the full file before sending
 * - Sets long-lived Cache-Control headers so browser caches automatically
 */

const { getSupabaseClient } = require('../config/supabaseStorage.config');
const { logger } = require('../utils/logger');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'products';

// ─── In-Memory Image Cache ────────────────────────────────────────────────────
// Simple map: filename → { buffer, contentType, cachedAt }
const imageCache = new Map();
const CACHE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB soft limit
let cacheSizeBytes = 0;

function evictOldestEntries() {
    // Evict oldest 20% of entries when limit is reached
    const entries = [...imageCache.entries()].sort(
        ([, a], [, b]) => a.cachedAt - b.cachedAt
    );
    const toEvict = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toEvict; i++) {
        const [key, val] = entries[i];
        cacheSizeBytes -= val.buffer.length;
        imageCache.delete(key);
        logger.debug(`🗑️  Image cache evicted: ${key}`);
    }
}

function cacheImage(filename, buffer, contentType) {
    if (buffer.length > CACHE_MAX_BYTES * 0.1) {
        // Don't cache single files larger than 5 MB
        return;
    }
    if (cacheSizeBytes + buffer.length > CACHE_MAX_BYTES) {
        evictOldestEntries();
    }
    imageCache.set(filename, { buffer, contentType, cachedAt: Date.now() });
    cacheSizeBytes += buffer.length;
    logger.debug(`💾 Image cached: ${filename} (${(buffer.length / 1024).toFixed(1)} KB) | Total: ${(cacheSizeBytes / 1024 / 1024).toFixed(1)} MB`);
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * Proxy a single product image from Supabase Storage.
 * Route: GET /api/images/proxy/:filename
 *
 * :filename can contain path segments, e.g. "folder/photo.jpg"
 * Use req.params[0] with route pattern '/proxy/*' to capture full path.
 */
async function proxyImage(req, res) {
    // Support both /proxy/:filename and /proxy/* (with slashes)
    const filename = req.params[0] || req.params.filename || '';

    if (!filename) {
        return res.status(400).json({ error: 'filename is required' });
    }

    // 1. Serve from cache if available
    if (imageCache.has(filename)) {
        const cached = imageCache.get(filename);
        logger.debug(`⚡ Cache HIT: ${filename}`);
        res.set('Content-Type', cached.contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('X-Cache', 'HIT');
        return res.send(cached.buffer);
    }

    logger.debug(`📡 Cache MISS: ${filename} – fetching from Supabase`);

    try {
        const supabase = getSupabaseClient();

        // 2. Download from Supabase Storage (service-role key bypasses RLS)
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .download(filename);

        if (error) {
            logger.warn(`⚠️  Supabase storage error for "${filename}": ${error.message}`);
            return res.status(404).json({ error: 'Image not found', details: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Image not found – empty response' });
        }

        // 3. Convert Blob → Buffer
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Detect content type
        const contentType = data.type || guessContentType(filename);

        // 5. Cache it
        cacheImage(filename, buffer, contentType);

        // 6. Stream to client
        res.set('Content-Type', contentType);
        res.set('Content-Length', buffer.length);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('X-Cache', 'MISS');
        return res.send(buffer);

    } catch (err) {
        logger.error(`❌ Image proxy error for "${filename}": ${err.message}`);
        return res.status(500).json({ error: 'Failed to proxy image', details: err.message });
    }
}

/** Guess MIME type from file extension */
function guessContentType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        avif: 'image/avif',
    };
    return types[ext] || 'application/octet-stream';
}

/** Cache stats – optional debug endpoint */
function cacheStats(req, res) {
    res.json({
        entries: imageCache.size,
        totalBytes: cacheSizeBytes,
        totalMB: (cacheSizeBytes / 1024 / 1024).toFixed(2),
        limitMB: (CACHE_MAX_BYTES / 1024 / 1024).toFixed(0),
    });
}

module.exports = { proxyImage, cacheStats };
