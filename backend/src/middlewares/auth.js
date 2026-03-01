/**
 * Authentication Middleware
 * =========================
 * 1. Checks for JWT in Authorization header.
 * 2. Decodes JWT to get Supabase user data.
 * 3. Syncs user with local PostgreSQL 'public.users' table to get an integer ID.
 * 4. Fails with 401 if authentication fails.
 */

const { decode } = require('../utils/token');
const { logger } = require('../utils/logger');
const db = require('../config/db');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = decode(token);

        if (decoded && decoded.error) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again'
            });
        }

        if (!decoded || !decoded.id || !decoded.email) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again'
            });
        }

        // SUPABASE UUID -> LOCAL INTEGER ID MAPPING
        // ----------------------------------------
        // Check if user exists in public.users by email
        const userQuery = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [decoded.email]
        );

        let localUserId;
        const rows = userQuery.rows;

        if (rows && rows.length > 0) {
            // User found, use their local integer ID
            localUserId = rows[0].id;
            logger.debug(`User synced: ${decoded.email} -> Local ID: ${localUserId}`);
        } else {
            // User NOT found in local DB, create them
            // Extract names from metadata if available
            const firstName = decoded.user_metadata?.firstname || decoded.user_metadata?.full_name?.split(' ')[0] || 'User';
            const lastName = decoded.user_metadata?.lastname || decoded.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

            logger.info(`Syncing new user to local DB: ${decoded.email}`);
            const insertResult = await db.query(
                'INSERT INTO users (firstname, lastname, email, password, created_on) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
                [firstName, lastName, decoded.email, 'supabase_auth_managed']
            );

            if (insertResult.rows && insertResult.rows.length > 0) {
                localUserId = insertResult.rows[0].id;
                logger.info(`New user created in local DB: ${decoded.email} -> ID: ${localUserId}`);
            } else {
                throw new Error('Failed to create local user entry');
            }
        }

        if (!localUserId) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again'
            });
        }

        // Attach local integer ID to request object
        req.user = {
            id: localUserId,
            email: decoded.email,
            supabaseId: decoded.id // Keep the UUID just in case
        };

        next();
    } catch (error) {
        logger.error('❌ Error in auth middleware:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again'
        });
    }
};

module.exports = { auth };
