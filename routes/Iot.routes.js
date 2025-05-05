import express from "express";
import {
  fetchAndStoreSeedData,
  updateRelayFlag,
} from "../controllers/Iot.controller.js";

const router = express.Router();

router.get("/fetch-seed-data", fetchAndStoreSeedData);
router.post("/toggle-relay", updateRelayFlag);

export default router;
