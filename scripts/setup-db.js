const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const setupDatabase = async () => {
  console.log("🔄 Connecting to database...");

  console.log("USER:", new URL(process.env.DATABASE_URL).username);
  console.log("HOST:", new URL(process.env.DATABASE_URL).host);


  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(
      `🔌 Attempting to connect to ${process.env.DATABASE_URL.split("@")[1]}...`
    );
    await client.connect();
    console.log("✅ Connected successfully.");

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
