"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
} from "@/components/ui";
import { CONFIG } from "@/config/config";
import { tenantFormSchema } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { encryptAadhaar, maskAadhaar } from "@/lib/encryption";
import { createTenantUser } from "@/app/actions/createTenant";

const bhkOptions = CONFIG.property.bhkTypes.map((b) => ({
  value: b.value,
  label: b.label,
}));
const floorOptions = CONFIG.property.floorNumbers;
const relationshipOptions = CONFIG.tenant.relationshipTypes.map((r) => ({
  value: r.value,
  label: r.label,
}));

export default function NewTenantPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    full_name: string;
    mobile_number: string;
    email: string;
    password: string;
    flat_number: string;
    floor_number: number;
    bhk_type: "1BHK" | "2BHK" | "3BHK";
    monthly_rent: string;
    rent_start_date: string;
    aadhaar_number: string;
    occupants: { name: string; relationship: string }[];
  }>({
    full_name: "",
    mobile_number: "",
    email: "",
    password: "",
    flat_number: "",
    floor_number: 0,
    bhk_type: "1BHK",
    monthly_rent: "",
    rent_start_date: "",
    aadhaar_number: "",
    occupants: [{ name: "", relationship: "self" }],
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const addOccupant = () => {
    if (formData.occupants.length >= CONFIG.property.maxOccupantsAllowed) {
      addToast({
        type: "warning",
        title: `Maximum ${CONFIG.property.maxOccupantsAllowed} occupants allowed`,
      });
      return;
    }
    setFormData({
      ...formData,
      occupants: [...formData.occupants, { name: "", relationship: "other" }],
    });
  };

  const removeOccupant = (index: number) => {
    if (formData.occupants.length === 1) {
      addToast({ type: "warning", title: "At least one occupant is required" });
      return;
    }
    const newOccupants = formData.occupants.filter((_, i) => i !== index);
    setFormData({ ...formData, occupants: newOccupants });
  };

  const updateOccupant = (index: number, field: string, value: string) => {
    const newOccupants = [...formData.occupants];
    newOccupants[index] = { ...newOccupants[index], [field]: value };
    setFormData({ ...formData, occupants: newOccupants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Prepare data for validation
    const dataToValidate = {
      ...formData,
      monthly_rent: Number(formData.monthly_rent),
      floor_number: Number(formData.floor_number),
    };

    // Validate
    const result = tenantFormSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      addToast({ type: "error", title: "Please fix the errors in the form" });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Create user account for tenant (Server Action)
      // This prevents the admin from being logged out
      const { userId } = await createTenantUser({
        email: formData.email,
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        password: formData.password,
      });

      // 2. Encrypt Aadhaar (Client side)
      const aadhaarEncrypted = await encryptAadhaar(formData.aadhaar_number);
      const aadhaarMasked = maskAadhaar(formData.aadhaar_number);

      // 3. Create tenant record (Client side - RLS will handle permission)
      // Note: Trigger might have created a profile already.
      // But we need to create the 'tenants' record which is specific to this app logic.
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          user_id: userId,
          landlord_id: (await supabase.auth.getUser()).data.user!.id, // Admin is landlord
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          email: formData.email,
          flat_number: formData.flat_number,
          floor_number: Number(formData.floor_number),
          bhk_type: formData.bhk_type,
          monthly_rent: Number(formData.monthly_rent),
          rent_start_date: formData.rent_start_date,
          aadhaar_encrypted: aadhaarEncrypted,
          aadhaar_masked: aadhaarMasked,
          total_occupants: formData.occupants.length,
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        addToast({
          type: "error",
          title: "Failed to create tenant",
          message: tenantError.message,
        });
        setIsLoading(false);
        return;
      }

      // 4. Create occupants
      if (tenant && formData.occupants.length > 0) {
        const occupantsToInsert = formData.occupants.map((occ) => ({
          tenant_id: tenant.id,
          name: occ.name,
          relationship: occ.relationship,
        }));

        const { error: occError } = await supabase
          .from("occupants")
          .insert(occupantsToInsert);

        if (occError) {
          console.error("Error creating occupants:", occError);
        }
      }

      addToast({ type: "success", title: "Tenant created successfully" });
      router.push("/admin/tenants");
    } catch (error) {
      console.error("Error creating tenant:", error);
      addToast({ type: "error", title: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link href='/admin/tenants'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='h-4 w-4' />
          </Button>
        </Link>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Add New Tenant</h1>
          <p className='text-gray-500'>Fill in all the required details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Full Name'
                placeholder='Enter full name'
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                error={errors.full_name}
                required
              />
              <Input
                label='Mobile Number'
                placeholder='9876543210'
                maxLength={10}
                value={formData.mobile_number}
                onChange={(e) =>
                  handleInputChange(
                    "mobile_number",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                error={errors.mobile_number}
                required
              />
            </div>

            <Input
              label='Email Address'
              type='email'
              placeholder='tenant@example.com'
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              required
            />

            <div className='relative'>
              <Input
                label='Password (for tenant login)'
                type={showPassword ? "text" : "password"}
                placeholder='••••••••'
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                error={errors.password}
                hint={`Minimum ${CONFIG.auth.passwordMinLength} characters`}
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>

            <div className='relative'>
              <Input
                label='Aadhaar Number'
                placeholder='123456789012'
                maxLength={12}
                value={
                  showAadhaar
                    ? formData.aadhaar_number
                    : formData.aadhaar_number.replace(/\d/g, "•")
                }
                onChange={(e) =>
                  handleInputChange(
                    "aadhaar_number",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                error={errors.aadhaar_number}
                hint='12-digit Aadhaar number (stored encrypted)'
                required
              />
              <button
                type='button'
                onClick={() => setShowAadhaar(!showAadhaar)}
                className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
              >
                {showAadhaar ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Flat Details */}
        <Card>
          <CardHeader>
            <CardTitle>Flat Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Input
                label='Flat Number'
                placeholder='e.g., A-101'
                value={formData.flat_number}
                onChange={(e) =>
                  handleInputChange("flat_number", e.target.value)
                }
                error={errors.flat_number}
                required
              />
              <Select
                label='Floor'
                options={floorOptions}
                value={formData.floor_number}
                onChange={(e) =>
                  handleInputChange("floor_number", e.target.value)
                }
                required
              />
              <Select
                label='BHK Type'
                options={bhkOptions}
                value={formData.bhk_type}
                onChange={(e) => handleInputChange("bhk_type", e.target.value)}
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Monthly Rent'
                type='number'
                placeholder='15000'
                value={formData.monthly_rent}
                onChange={(e) =>
                  handleInputChange("monthly_rent", e.target.value)
                }
                error={errors.monthly_rent}
                hint={`${CONFIG.currency.symbol}${CONFIG.validation.rent.min} - ${CONFIG.currency.symbol}${CONFIG.validation.rent.max}`}
                required
              />
              <Input
                label='Rent Start Date'
                type='date'
                value={formData.rent_start_date}
                onChange={(e) =>
                  handleInputChange("rent_start_date", e.target.value)
                }
                error={errors.rent_start_date}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Occupants */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>Occupants ({formData.occupants.length})</CardTitle>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addOccupant}
            >
              <Plus className='h-4 w-4 mr-1' />
              Add
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            {formData.occupants.map((occupant, index) => (
              <div
                key={index}
                className='flex items-start gap-4 p-4 bg-gray-50 rounded-lg'
              >
                <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Input
                    label={`Occupant ${index + 1} Name`}
                    placeholder='Enter name'
                    value={occupant.name}
                    onChange={(e) =>
                      updateOccupant(index, "name", e.target.value)
                    }
                    error={errors[`occupants.${index}.name`]}
                    required
                  />
                  <Select
                    label='Relationship'
                    options={relationshipOptions}
                    value={occupant.relationship}
                    onChange={(e) =>
                      updateOccupant(index, "relationship", e.target.value)
                    }
                    required
                  />
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => removeOccupant(index)}
                  className='mt-7'
                >
                  <Trash2 className='h-4 w-4 text-red-500' />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-end gap-4'>
          <Link href='/admin/tenants'>
            <Button type='button' variant='outline'>
              Cancel
            </Button>
          </Link>
          <Button type='submit' isLoading={isLoading}>
            Create Tenant
          </Button>
        </div>
      </form>
    </div>
  );
}
