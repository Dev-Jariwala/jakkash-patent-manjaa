// app.js
import express from 'express';
import session from "express-session";
import cors from "cors";

import passport from "./config/passport.js";
import userRoutes from "./routes/users.js";
import collectionRoutes from "./routes/collection.js";
import productRoutes from "./routes/products.js";
import stockRoutes from "./routes/stocks.js";
import billRoutes from "./routes/bills.js";
import clientRoutes from "./routes/clients.js";
import purchaseRoutes from "./routes/purchases.js";
import analyticsRoutes from "./routes/analytics.js";
import settingsRoutes from "./routes/settings.js";
import commonRoutes from "./routes/common.js";
import { verifyDatabaseConnection } from "./config/db.js";
import { verifyRedisConnection } from "./config/redis.js";
import { closeWhatsAppBillDeliveryQueue } from "./queues/whatsappBillDeliveryQueue.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://jakkash-patent-manjaa.vercel.app', 'https://jakkashmanja.in', 'https://www.jakkashmanja.in', 'http://jakkashmanja.in'],
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/imgs", express.static("uploads/imgs"));
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/common", commonRoutes);
app.use("/api/collections", collectionRoutes, productRoutes, stockRoutes, billRoutes, purchaseRoutes, analyticsRoutes);

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  verifyDatabaseConnection();
  verifyRedisConnection();
});

// The API holds a Redis connection for the delivery queue; releasing it on
// shutdown keeps a restart from leaving a socket behind.
async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close();
  try {
    await closeWhatsAppBillDeliveryQueue();
  } catch (error) {
    console.error("Failed to close the WhatsApp delivery queue:", error);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
