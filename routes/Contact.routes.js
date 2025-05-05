import express from "express";
import { sendContactEmail } from "../controllers/Contact.controller.js";

const router = express.Router();

router.post("/send-contact", sendContactEmail);

export default router;
