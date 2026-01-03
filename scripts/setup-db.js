const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const setupDatabase = async () => {
  console.log("🔄 Connecting to database...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected.");

    const schemaPath = path.resolve(__dirname, "../supabase/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("📜 executing schema...");
    await client.query(schemaSql);

    console.log("✅ Tables created successfully.");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
  }
};

setupDatabase();
