import express from "express";

import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";

import {
  getClientAccount,
  saveClientAccount,
} from "../controllers/clientAccountController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// Client Routes
// =====================================================

// Create client
router.post(
  "/",
  protect,
  createClient
);

// Get all clients
router.get(
  "/",
  protect,
  getClients
);

// =====================================================
// Client Account Routes
// =====================================================

// Get account information for a client
router.get(
  "/:clientId/account",
  protect,
  getClientAccount
);

// Create or update account information for a client
router.put(
  "/:clientId/account",
  protect,
  saveClientAccount
);

// =====================================================
// Individual Client Routes
// =====================================================

// Get one client
router.get(
  "/:id",
  protect,
  getClientById
);

// Update client
router.put(
  "/:id",
  protect,
  updateClient
);

// Delete client
router.delete(
  "/:id",
  protect,
  deleteClient
);

export default router;