import pool from "../config/db.js";

export const query = async (sql, values, retries = 3) => {
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
