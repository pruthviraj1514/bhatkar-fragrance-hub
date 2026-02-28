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
    // Corrected: Remove folder prefix as bucket is already "products"
    const filePath = `${Date.now()}-${fileName}`;

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            console.error("SUPABASE UPLOAD ERROR Details:", {
                message: error.message,
                statusCode: error.statusCode,
                error: error.error,
                bucket,
                filePath
            });
            throw new Error(`Supabase upload error: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error("SUPABASE UPLOAD EXCEPTION:", err);
        throw err;
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} fileUrl 
 */
async function deleteFromSupabase(fileUrl) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';

    try {
        // Extract path from public URL
        const urlParts = fileUrl.split(`${bucket}/`);
        if (urlParts.length < 2) return;

        const filePath = urlParts[urlParts.length - 1];

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error("SUPABASE DELETE ERROR:", {
                message: error.message,
                fileUrl,
                filePath
            });
        }
    } catch (err) {
        console.error("SUPABASE DELETE EXCEPTION:", err);
    }
}

module.exports = {
    supabase,
    uploadToSupabase,
    deleteFromSupabase
};
