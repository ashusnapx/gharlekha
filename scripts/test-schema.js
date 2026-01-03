const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSchema() {
  console.log("🔍 Testing Database Schema via HTTP Check...");

  // 1. Check Profiles Table
  console.log('\n1️⃣ Checking "profiles" table...');
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  if (profileError) {
    console.error(
      '❌ Failed to access "profiles" table:',
      profileError.message
    );
    if (profileError.code === "42P01")
      console.error("   Table likely DOES NOT EXIST.");
  } else {
    console.log('✅ "profiles" table exists/accessible.');
  }

  // 2. Check generate_landlord_code function
  console.log('\n2️⃣ Checking "generate_landlord_code" function...');
  const { data: code, error: rpcError } = await supabase.rpc(
    "generate_landlord_code"
  );

  if (rpcError) {
    console.error("❌ function call failed:", rpcError.message);
  } else {
    console.log(`✅ Function works. Generated Code: ${code}`);
  }
}

testSchema();
