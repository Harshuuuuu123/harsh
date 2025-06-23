import nodemailer from "nodemailer";
import "dotenv/config";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendObjectionMail = async (
  to: string,
  noticeTitle: string,
  objectorName: string | null | undefined,
  reason: string | null | undefined
) => {
  const safeObjectorName = objectorName ?? "Anonymous";
  const safeReason = reason ?? "No reason provided";

  const mailOptions = {
    from: `"Jahir Soochna" <${process.env.SMTP_USER}>`,
    to,
    subject: `New Objection on Notice: ${noticeTitle}`,
    html: `
      <p>Hello Lawyer,</p>
      <p>A new objection has been raised on your notice <strong>${noticeTitle}</strong>.</p>
      <p><strong>Objector:</strong> ${safeObjectorName}</p>
      <p><strong>Reason:</strong> ${safeReason}</p>
      <p>Login to your dashboard to review it.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
