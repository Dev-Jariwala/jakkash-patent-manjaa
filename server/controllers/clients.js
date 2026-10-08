// CREATE TABLE clients (
// 	sr_no SERIAL PRIMARY KEY,
//     client_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     name VARCHAR(100) NOT NULL,
//     mobile VARCHAR(20) NOT NULL UNIQUE,
//     address VARCHAR(255) NOT NULL
// );

import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";
import { createClient } from "../services/clientMaintenance.js";
import {
    createClientMaintenanceDeps,
    listClientsPaginated,
} from "../services/clientMaintenanceStore.js";

export const getClients = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const intPage = page ? parseInt(page) : 1;
    const intLimit = limit ? parseInt(limit) : 10;
    const offset = (intPage - 1) * intLimit;
    try {
        const { clients, totalCount } = await listClientsPaginated({
            search,
            limit: intLimit,
            offset,
        });
        const totalPages = Math.ceil(totalCount / intLimit);
        const nextPage = intPage < totalPages ? intPage + 1 : undefined;

        res.json({
            clients,
            totalClients: totalCount,
            totalPages,
            nextPage
        });
    } catch (error) {
        handleError('getClients', res, error);
    }
};

export const createClientHandler = async (req, res) => {
    try {
        const client = await createClient(createClientMaintenanceDeps(), req.body);
        res.status(201).json({ client });
    } catch (error) {
        handleError("createClient", res, error);
    }
};

export const getClientByMobileNumber = async (req, res) => {
    const { mobile } = req.params;
    try {
        const [client] = await query(`select * from clients where mobile = $1`, [mobile]);
        res.json({ client });
    } catch (error) {
        handleError('getClientByMobileNumber', res, error);
    }
}

export const getAllClients = async (req, res) => {
    try {
        const clients = await query(`select name, mobile from clients`);
        res.json({ clients });
    } catch (error) {
        handleError('getAllClients', res, error);
    }
}