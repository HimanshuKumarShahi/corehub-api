import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "cerberus",
    product: {
      name: "CoreHub_API",
      link: "https://corehub-api.com",
      logo: "https://placehold.co/200x50/1e293b/ffffff?text=CoreHub+API",
      logoHeight: "40px",
      copyright: "© 2026 CoreHub_API. All rights reserved.",
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
    from: '"CoreHub API" <Himanshu@corehub-api.com>',
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed silently. Check your .env or MAILTRAP credentials."
    );
    console.error("ERROR: ", error);
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
