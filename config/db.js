const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log(
      "📍 MongoDB URI:",
      process.env.MONGO_URI ? "URI found in env" : "❌ URI NOT found in env"
    );

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected Successfully");
    console.log("🏪 Database Name:", conn.connection.db.databaseName);
    console.log("🌐 Host:", conn.connection.host);
    console.log("🔌 Port:", conn.connection.port);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
