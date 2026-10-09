import pool from "../config/db.js";

/** @type {((sql: string, values?: unknown[]) => Promise<unknown[]>) | null} */
let queryImplementationOverride = null;

/** Test-only seam so controller handlers can run against an in-memory stand-in. */
export function __setQueryImplementationForTests(override) {
    queryImplementationOverride = override;
}

export const query = async (sql, values, retries = 3) => {
    if (queryImplementationOverride) {
        return queryImplementationOverride(sql, values);
    }
    try {
        // Execute the query using the pool
        const { rows } = await pool.query(sql, values);
        return rows;
    } catch (error) {
        console.log("Error in query", error);
        if ((error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') && retries > 0) {
            console.log("Reconnecting to the database. Attempts remaining:", retries);
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Was `pgquery(...)`, which does not exist: every connection-reset
            // retry threw a ReferenceError instead of reconnecting.
            return query(sql, values, retries - 1);
        }
        throw error;
    }
};
