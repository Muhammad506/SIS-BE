import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, code) => {
  try {
    // Create a transporter using Gmail's SMTP server and App Password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App Password generated from Google
      },
    });

    // Email message options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Your Gmail address
      to: email, // Recipient's email
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: `<strong>Your verification code is: ${code}</strong>`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error; // Rethrow the error to be handled in the controller
  }
};
