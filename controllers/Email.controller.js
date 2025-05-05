import { sendVerificationEmail } from "../utils/sendEmail.js";
import bcrypt from "bcrypt";
import User from "../models/User.model.js";

let tempVerificationCodes = {};

export const sendCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const code = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  tempVerificationCodes[email] = { code, expiresAt };

  try {
    await sendVerificationEmail(email, code);
    res.status(200).json({ message: "Verification code sent." });
  } catch (error) {
    res.status(500).json({ message: "Failed to send email." });
  }
};

export const verifyCode = (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const storedCode = tempVerificationCodes[email];

    if (!storedCode) {
      return res
        .status(400)
        .json({ message: "Verification code not found or invalid." });
    }

    if (storedCode.expiresAt < Date.now()) {
      delete tempVerificationCodes[email];
      return res
        .status(400)
        .json({ message: "Verification code has expired." });
    }

    if (storedCode.code.toString() !== code.toString()) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // Delete the code after successful verification
    delete tempVerificationCodes[email];
    return res.status(200).json({ message: "Code verified successfully." });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  // Validate password
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long, contain at least one uppercase letter, one number, and one special character (@$!%*?&#).",
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    user.password = password; // Pre-save hook will hash it
    await user.save();

    // Delete the verification code (if it exists)
    delete tempVerificationCodes[email];

    // Clear cookies (optional)
    res.clearCookie("token");

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    return res.status(500).json({ message: "Error resetting password." });
  }
};
