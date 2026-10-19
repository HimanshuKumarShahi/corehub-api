import express from "express";
import cors from "cors";

const app = express();

// Basic Configurations
app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Cors Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.get("/", (req, res) => {
  res.send(
    "Modular plug-and-play production-ready backend engine for rapid -> frontend prototyping and hackathons & many more."
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

app.listen(8000, () => {
  console.log("Server is on 8000");
});

export default app;
