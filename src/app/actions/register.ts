"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function registerUser(formData: {
  email: string;
  password: string;
  full_name: string;
  mobile_number: string;
  role: "tenant" | "admin";
  landlord_code?: string;
}) {
  const supabaseAdmin = await createAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      role: formData.role,
      landlord_code: formData.landlord_code,
    },
  });

  if (error) {
    console.error("Registration Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }

  // MANUAL PROFILE CREATION (Bypassing Trigger)
  // If the trigger was removed as advised, we need to create the profile here.
  // Even if trigger exists and didn't fail (unlikely if we are here), upsert is safe.

  if (formData.role === "admin") {
    const landlordCode = generateLandlordCode();
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        mobile_number: formData.mobile_number,
        landlord_code: landlordCode,
      });

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
      // If profile fails, we might want to clean up user, but let's keep it simple
    }
  } else {
    // Tenant Profile
    let linkedLandlordId = null;
    if (formData.landlord_code) {
      const safeCode = formData.landlord_code.trim().toUpperCase();
      const { data: landlord } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("landlord_code", safeCode)
        .eq("role", "admin")
        .single();
      linkedLandlordId = landlord?.id;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: formData.email,
        full_name: formData.full_name, // Fixed: use camelCase from form, assumes match
        role: formData.role,
        mobile_number: formData.mobile_number,
        linked_landlord_id: linkedLandlordId,
      });

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
    }
  }

  return { success: true, userId: data.user.id };
}

function generateLandlordCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
