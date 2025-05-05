import express from "express";
import { sendCode, verifyCode, resetPassword } from "../controllers/Email.controller.js";

const router = express.Router();
router.post("/send-code", sendCode);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

export default router;
