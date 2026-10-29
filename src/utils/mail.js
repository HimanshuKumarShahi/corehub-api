import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const logEmailToConsole = (options) => {
  const actionLink =
    options.mailgenContent?.body?.action?.button?.link || "N/A";
  const token =
    options.mailgenContent?.body?.dictionary?.["Postman Test Token"] ||
    actionLink.split("/").pop();

  console.log("\n==========================================================");
  console.log("📬 CONSOLE EMAIL MODE (SMTP BYPASSED)");
  console.log("==========================================================");
  console.log(`👤 To:      ${options.email}`);
  console.log(`📌 Subject: ${options.subject}`);
  console.log(`🔑 Token:   ${token}`);
  console.log(`🔗 URL:     ${actionLink}`);
  console.log("==========================================================\n");
};

const sendEmail = async (options) => {
  const isEmailEnabled = process.env.ENABLE_EMAIL === "true";
  const hasSmtpCredentials =
    process.env.MAILTRAP_SMPT_HOST &&
    process.env.MAILTRAP_SMPT_USER &&
    process.env.MAILTRAP_SMPT_PASS;

  if (!isEmailEnabled || !hasSmtpCredentials) {
    logEmailToConsole(options);
    return;
  }

  const mailGenerator = new Mailgen({
    theme: "cerberus",
    product: {
      name: "CoreHub",
      link: "https://corehub-api.com",
      logo: "https://placehold.co/200x50/1e293b/ffffff?text=CoreHub+API",
      logoHeight: "40px",
      copyright: "© 2026 CoreHub API. All rights reserved.",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMPT_HOST,
    port: process.env.MAILTRAP_SMPT_PORT,
    auth: {
      user: process.env.MAILTRAP_SMPT_USER,
      pass: process.env.MAILTRAP_SMPT_PASS,
    },
  });

  const mail = {
    from: '"CoreHub API" <noreply@corehub-api.com>',
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "⚠️ SMTP Email failed. Falling back to Console Mode so you can continue testing:"
    );
    console.error("ERROR:", error.message);
    logEmailToConsole(options);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  const token = verificationUrl.split("/").pop();

  return {
    body: {
      name: username,
      intro: "Welcome to CoreHub! We're very excited to have you on board.",
      dictionary: {
        "Postman Test Token": token,
      },
      action: {
        instructions:
          "Or, verify your email address by clicking the button below:",
        button: {
          color: "#2563eb",
          text: "Verify Your Email",
          link: verificationUrl,
        },
      },
      outro:
        "If you didn't create an account with CoreHub, you can safely ignore this email.",
      signature: "Sincerely",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  const token = passwordResetUrl.split("/").pop();

  return {
    body: {
      name: username,
      intro:
        "You are receiving this email because a password reset request was submitted for your account.",
      dictionary: {
        "Postman Test Token": token,
      },
      action: {
        instructions:
          "Or, click the button below to reset your password. This link will expire in 20 minutes.",
        button: {
          color: "#dc2626",
          text: "Reset Your Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "If you did not request a password reset, no further action is required and your password remains secure.",
      signature: "Sincerely",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
