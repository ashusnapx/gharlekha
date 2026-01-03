const dns = require("dns");
const https = require("https");
const { Client } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const REFERNCE_ID = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", "").replace(
      ".supabase.co",
      ""
    )
  : "UNKNOWN";

const DIRECT_HOST = `db.${REFERNCE_ID}.supabase.co`;
const POOLER_HOST = `aws-0-ap-south-1.pooler.supabase.com`; // Assuming AP-South-1 based on user input

console.log("🔍 STARTING DIAGNOSTICS...\n");
console.log(`📌 Project Ref: ${REFERNCE_ID}`);
console.log(`📌 Direct Host: ${DIRECT_HOST}`);
console.log(`📌 Pooler Host: ${POOLER_HOST}`);

async function checkDNS(host) {
  return new Promise((resolve) => {
    console.log(`\nTesting DNS for ${host}...`);
    dns.lookup(host, (err, address, family) => {
      if (err) {
        console.error(`❌ DNS Lookup Failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`✅ Resolved: ${address} (IPv${family})`);
        resolve(true);
      }
    });
  });
}

function checkHTTP() {
  return new Promise((resolve) => {
    const url = `https://${REFERNCE_ID}.supabase.co`;
    console.log(`\nTesting HTTP Access to ${url}...`);
    https
      .get(url, (res) => {
        console.log(`HTTP Status: ${res.statusCode}`);
        if (
          res.statusCode === 200 ||
          res.statusCode === 404 ||
          res.statusCode === 401
        ) {
          console.log("✅ Project Endpoint Reachable (Project likely UP)");
        } else if (res.statusCode === 503) {
          console.error("❌ Project Paused (503 Service Unavailable)");
        } else {
          console.warn(`⚠️ Unexpected Status: ${res.statusCode}`);
        }
        resolve();
      })
      .on("error", (e) => {
        console.error(`❌ HTTP Failed: ${e.message}`);
        resolve();
      });
  });
}

async function run() {
  await checkDNS(DIRECT_HOST);
  await checkDNS(POOLER_HOST);
  await checkHTTP();

  console.log("\n--- DIAGNOSIS SUMMARY ---");
  console.log(
    "If DNS Failed for Direct Host: Your network has issues resolving Supabase (try Google DNS 8.8.8.8)."
  );
  console.log(
    "If Pooler Host Resolved but Connection Failed: Check Project Status or Password."
  );
  console.log(
    "If HTTP returned 503: Your Project is PAUSED. Log in to Supabase to restore it."
  );
}

run();
