"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
  useToast,
} from "@/components/ui";
import {
  formatCurrency,
  formatDate,
  getBHKLabel,
  getRelationshipLabel,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tenant, Occupant } from "@/types";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [params.id]);

  const loadTenant = async () => {
    try {
      const supabase = createClient();

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", params.id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      const { data: occupantsData } = await supabase
        .from("occupants")
        .select("*")
        .eq("tenant_id", params.id);

      setOccupants(occupantsData || []);
    } catch (error) {
      console.error("Error loading tenant:", error);
      addToast({ type: "error", title: "Failed to load tenant" });
      router.push("/admin/tenants");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/admin/tenants'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold text-gray-900'>
                {tenant.full_name}
              </h1>
              <Badge variant={tenant.is_active ? "success" : "danger"}>
                {tenant.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className='text-gray-500'>Flat {tenant.flat_number}</p>
          </div>
        </div>
        <Link href={`/admin/tenants/${tenant.id}/edit`}>
          <Button>
            <Edit className='h-4 w-4 mr-2' />
            Edit
          </Button>
        </Link>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                <User className='h-5 w-5 text-indigo-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Full Name</p>
                <p className='font-medium text-gray-900'>{tenant.full_name}</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center'>
                <Phone className='h-5 w-5 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Mobile</p>
                <p className='font-medium text-gray-900'>
                  {tenant.mobile_number}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <Mail className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Email</p>
                <p className='font-medium text-gray-900'>{tenant.email}</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center'>
                <span className='text-purple-600 font-semibold text-sm'>
                  ID
                </span>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Aadhaar</p>
                <p className='font-medium text-gray-900'>
                  {tenant.aadhaar_masked}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flat Details */}
      <Card>
        <CardHeader>
          <CardTitle>Flat Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center'>
                <Home className='h-5 w-5 text-orange-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Flat Number</p>
                <p className='font-medium text-gray-900'>
                  {tenant.flat_number}
                </p>
              </div>
            </div>

            <div>
              <p className='text-sm text-gray-500'>Floor</p>
              <p className='font-medium text-gray-900'>
                {tenant.floor_number === 0
                  ? "Ground Floor"
                  : `Floor ${tenant.floor_number}`}
              </p>
            </div>

            <div>
              <p className='text-sm text-gray-500'>BHK Type</p>
              <p className='font-medium text-gray-900'>
                {getBHKLabel(tenant.bhk_type)}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center'>
                <span className='text-green-600 font-semibold text-sm'>₹</span>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Monthly Rent</p>
                <p className='font-medium text-gray-900'>
                  {formatCurrency(tenant.monthly_rent)}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                <Calendar className='h-5 w-5 text-indigo-600' />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Rent Start Date</p>
                <p className='font-medium text-gray-900'>
                  {formatDate(tenant.rent_start_date)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupants */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Occupants ({occupants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {occupants.length === 0 ? (
            <p className='text-gray-500 text-sm'>No occupants recorded</p>
          ) : (
            <div className='space-y-3'>
              {occupants.map((occupant, index) => (
                <div
                  key={occupant.id}
                  className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'
                >
                  <div className='h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center'>
                    <span className='text-indigo-600 font-semibold text-sm'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>{occupant.name}</p>
                    <p className='text-sm text-gray-500'>
                      {getRelationshipLabel(occupant.relationship)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Link href={`/admin/meter-readings?tenant=${tenant.id}`}>
              <Button variant='outline'>Add Meter Reading</Button>
            </Link>
            <Link href={`/admin/billing?tenant=${tenant.id}`}>
              <Button variant='outline'>Generate Bill</Button>
            </Link>
            <Link href={`/admin/notes?tenant=${tenant.id}`}>
              <Button variant='outline'>Add Note</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
