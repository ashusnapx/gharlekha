"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function createTenantUser(formData: {
  email: string;
  full_name: string;
  mobile_number: string;
  password?: string;
}) {
  // 1. Verify Current User is Admin
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  // 2. Fetch Admin Profile to get Landlord Code
  const { data: adminProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role, landlord_code")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    adminProfile.role !== "admin" ||
    !adminProfile.landlord_code
  ) {
    throw new Error("Unauthorized or missing Landlord Code");
  }

  // 3. Create Tenant User
  const supabaseAdmin = await createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password || "GharLekha@123", // Fallback or required
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      role: "tenant",
      landlord_code: adminProfile.landlord_code, // Link to this admin
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return { userId: data.user.id };
}
