"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function registerUser(formData: {
  email: string;
  password: string;
  full_name: string;
  mobile_number: string;
  role: "tenant" | "admin";
  landlord_code?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        success: false,
        error:
          "Server Configuration Error: Missing Supabase Environment Variables",
      };
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
      return { success: false, error: error.message };
    }

    // MANUAL PROFILE CREATION (Bypassing Trigger)
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
        return {
          success: false,
          error: "Failed to create profile: " + profileError.message,
        };
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
          full_name: formData.full_name,
          role: formData.role,
          mobile_number: formData.mobile_number,
          linked_landlord_id: linkedLandlordId,
        });

      if (profileError) {
        console.error("Profile Creation Error:", profileError);
        return {
          success: false,
          error: "Failed to create profile: " + profileError.message,
        };
      }
    }

    return { success: true, userId: data.user.id };
  } catch (error: any) {
    console.error("Unexpected Registration Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

function generateLandlordCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
