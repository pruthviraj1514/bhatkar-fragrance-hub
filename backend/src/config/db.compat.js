/**
 * DATABASE COMPATIBILITY LAYER
 * ============================
 * Makes PostgreSQL work with MySQL-style code
 * Wraps the pg pool to return mysql2-compatible results
 */

const supabaseDb = require('./supabase.db.config');
const { logger } = require('../utils/logger');

/**
 * Wrap pg query results to be mysql2-compatible
 */
function mysqlize(result) {
    // If it's an array with rows, convert to mysql2 style
    if (result && result.rows) {
        return [result.rows, { 
            affectedRows: result.rowCount || 0,
            insertId: result.rows[0]?.id || null
        }];
    }
    return [result, { affectedRows: 0 }];
}

/**
 * Execute query MySQL style
 */
async function query(sql, params = []) {
    try {
        const result = await supabaseDb.executeQuery(sql, params);
        
        // Check if it's a SELECT query (has rows)
        if (result && result.rows) {
            return mysqlize(result);
        }
        
        // For INSERT/UPDATE/DELETE
        return [result, { 
            affectedRows: result.rowCount || 0,
            insertId: null
        }];
    } catch (error) {
        logger.error(`Query error: ${error.message}`);
        throw error;
    }
}

/**
 * Execute with placeholders (for compatibility)
 */
async function execute(sql, params = []) {
    return query(sql, params);
}

/**
 * Get connection (for transactions)
 * PostgreSQL doesn't support getConnection the same way
 * Returns wrapper with beginTransaction, commit, rollback
 */
async function getConnection() {
    const client = await supabaseDb.getConnection();
    
    return {
        ...client,
        // Begin transaction
        beginTransaction: async () => {
            await client.query('BEGIN');
        },
        // Commit
        commit: async () => {
            await client.query('COMMIT');
        },
        // Rollback
        rollback: async () => {
            await client.query('ROLLBACK');
        },
        // Release back to pool
        release: () => {
            client.release();
        },
        // Query on this connection
        query: async (sql, params = []) => {
            const result = await client.query(sql, params);
            if (result && result.rows) {
                return [result.rows, {
                    affectedRows: result.rowCount || 0,
                    insertId: result.rows[0]?.id || null
                }];
            }
            return [result, { affectedRows: result.rowCount || 0 }];
        },
        // Execute (alias)
        execute: async (sql, params = []) => {
            return client.query(sql, params).then(result => {
                if (result && result.rows) {
                    return [result.rows, {
                        affectedRows: result.rowCount || 0,
                        insertId: result.rows[0]?.id || null
                    }];
                }
                return [result, { affectedRows: result.rowCount || 0 }];
            });
        }
    };
}

// Export compatibility functions
module.exports = {
    query,
    execute,
    getConnection,
    // Also export supabase functions directly
    ...supabaseDb
};
