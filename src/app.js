import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth/auth.routes.js";

const app = express();

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(cookieParser());

import healthCheckRouter from "./routes/healthCheck.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send(
    "Modular plug-and-play production-ready backend engine for rapid frontend prototyping and hackathons & many more"
  );
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export default app;
