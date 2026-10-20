import mongoose from "mongoose";
import { Sequelize } from "sequelize";

let sequelize;

const connectDB = async () => {
  const activeDB = process.env.ACTIVE_DB || "mongo";

  if (activeDB === "mongo") {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(
        `✅ MongoDB Connected! Host: ${conn.connection.host} | DB: ${conn.connection.name}`
      );
      mongoose.connection.on("disconnected", () =>
        console.warn("☠️ MongoDB connection lost.")
      );
      mongoose.connection.on("error", (err) =>
        console.error("❌ MongoDB runtime error:", err.message)
      );
    } catch (error) {
      console.error("❌ MongoDB Connection Error:", error.message);
      process.exit(1);
    }
  } else if (activeDB === "postgres") {
    try {
      sequelize = new Sequelize(process.env.POSTGRES_URI);
      await sequelize.authenticate();
      console.log(`✅ PostgreSQL Connected!`);
    } catch (error) {
      console.error("❌ PostgreSQL Connection Error:", error.message);
      process.exit(1);
    }
  }
};

const gracefulExit = async () => {
  const activeDB = process.env.ACTIVE_DB || "mongo";

  if (activeDB === "mongo") {
    await mongoose.connection.close();
  }

  if (activeDB === "postgres" && sequelize) {
    await sequelize.close();
  }

  console.log(
    `✅ ${activeDB} connection closed cleanly due to app termination`
  );
  process.exit(0);
};

process.on("SIGINT", gracefulExit);
process.on("SIGTERM", gracefulExit);

export default connectDB;
