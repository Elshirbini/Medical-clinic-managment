import nodemailer from "nodemailer";
import { configDotenv } from "dotenv";
import { ApiError } from "./apiError.js";
configDotenv();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ahmedalshirbini33@gmail.com",
    pass: process.env.PASS_GMAIL_SERVICE,
  },
});

export const sendToEmails = async(email, subject, html) => {
  const mailOptions = {
    from: "ahmedalshirbini33@gmail.com",
    to: email,
    subject: subject,
    html: html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info; 
  } catch (error) {
    console.log(error);
    if (error) throw new ApiError("This email is invalid, please try another one", 403);
  }
};
