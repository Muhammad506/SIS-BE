import dotenv from "dotenv";
import express from "express";
import connectDB from "./db.js";
import cors from "cors";

dotenv.config();
const app = express(); 
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Route imports
import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/Contact.routes.js";
import iotRoutes from "./routes/Iot.routes.js";
import emailRoutes from "./routes/email.routes.js";
import { startSeedDataFetchLoop } from "./services/seedDataUpdater.js";

// ✅ Background data fetch
startSeedDataFetchLoop();

// ✅ Base route for health check
app.get("/", (req, res) => {
  res.send("🚀 Welcome to the API! Server is running.");
});

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/email", emailRoutes);


// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
