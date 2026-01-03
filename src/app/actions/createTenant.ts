"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createTenantUser(formData: {
  email: string;
  full_name: string;
  mobile_number: string;
  password?: string;
  flat_number: string;
  floor_number: number;
  bhk_type: string;
  monthly_rent: number;
  rent_start_date: string;
  aadhaar_number: string;
  occupants: { name: string; relationship: string }[];
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

  // 3. Create Tenant User (Auth)
  // Direct instantiation to ensure Service Role bypassing RLS
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password || "GharLekha@123",
    email_confirm: true,
    user_metadata: {
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      role: "tenant",
      landlord_code: adminProfile.landlord_code,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user.id;

  // 4. Create Profile (Service Role)
  const { error: tenantProfileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: formData.email,
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      role: "tenant",
      linked_landlord_id: user.id, // Direct link to creating Admin
    });

  if (tenantProfileError) {
    console.error("Failed to create tenant profile:", tenantProfileError);
    // Cleanup auth user? Maybe. But throwing stops here.
    throw new Error(
      "Failed to initialize tenant profile: " + tenantProfileError.message
    );
  }

  // 5. Encrypt Aadhaar (Server Side - Secure)
  // We need to import encryptAadhaar and maskAadhaar dynamically or import at top
  const { encryptAadhaar, maskAadhaar } = await import("@/lib/encryption");
  const aadhaarEncrypted = await encryptAadhaar(formData.aadhaar_number);
  const aadhaarMasked = maskAadhaar(formData.aadhaar_number);

  // 6. Create Tenant Record (Service Role)
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      user_id: userId,
      landlord_id: user.id, // Admin's ID
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      email: formData.email,
      flat_number: formData.flat_number,
      floor_number: formData.floor_number,
      bhk_type: formData.bhk_type,
      monthly_rent: formData.monthly_rent,
      rent_start_date: formData.rent_start_date,
      aadhaar_encrypted: aadhaarEncrypted,
      aadhaar_masked: aadhaarMasked,
      total_occupants: formData.occupants.length,
      is_active: true,
    })
    .select()
    .single();

  if (tenantError) {
    console.error("Failed to create tenant record:", tenantError);
    throw new Error("Failed to create tenant record: " + tenantError.message);
  }

  // 7. Create Occupants (Service Role)
  if (formData.occupants.length > 0) {
    const occupantsToInsert = formData.occupants.map((occ) => ({
      tenant_id: tenant.id,
      name: occ.name,
      relationship: occ.relationship,
    }));

    const { error: occError } = await supabaseAdmin
      .from("occupants")
      .insert(occupantsToInsert);

    if (occError) {
      console.error("Error creating occupants:", occError);
      // Non-fatal, but worth logging
    }
  }

  return { userId, tenantId: tenant.id };
}
