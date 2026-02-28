const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase configuration missing in .env');
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Upload file buffer to Supabase Storage
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<string>} Public URL
 */
async function uploadToSupabase(fileBuffer, fileName, mimeType) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
    const filePath = `products/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

/**
 * Delete file from Supabase Storage
 * @param {string} fileUrl 
 */
async function deleteFromSupabase(fileUrl) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
    // Extract path from public URL
    // Format: https://.../storage/v1/object/public/products/products/123-image.jpg
    const pathParts = fileUrl.split(`${bucket}/`);
    if (pathParts.length < 2) return;

    const filePath = pathParts[pathParts.length - 1];

    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        console.error(`Supabase delete error: ${error.message}`);
    }
}

module.exports = {
    supabase,
    uploadToSupabase,
    deleteFromSupabase
};
