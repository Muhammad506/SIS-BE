
import express from "express";
import {
  fetchAndStoreSeedData,
  updateRelayFlag,
  getLatestData,
} from "../controllers/Iot.controller.js";
import fetchUser from "../middleware/fetchuser.js";

const router = express.Router();

router.get("/fetch-seed-data", fetchUser, fetchAndStoreSeedData);

router.post("/toggle-relay", fetchUser, updateRelayFlag);

router.get("/latest-data", fetchUser, getLatestData);

export default router;
