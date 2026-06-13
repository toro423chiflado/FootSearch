import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://footsearch:footsearch_secret@localhost:27017/footsearch?authSource=admin";

export async function conectarMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log("[mongo] conectado");
}

mongoose.connection.on("error", (err) => {
  console.error("[mongo] error de conexión:", err.message);
});
