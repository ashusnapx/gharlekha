"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  Spinner,
  EmptyState,
  ConfirmDialog,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate, getBHKLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/types";

export default function TenantsPage() {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTenants = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", JSON.stringify(error, null, 2));
      addToast({ type: "error", title: "Failed to load tenants" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: false })
        .eq("id", deleteId);

      if (error) throw error;

      setTenants(
        tenants.map((t) => (t.id === deleteId ? { ...t, is_active: false } : t))
      );
      addToast({ type: "success", title: "Tenant deactivated successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      addToast({ type: "error", title: "Failed to deactivate tenant" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.flat_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.mobile_number.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Tenants</h1>
          <p className='text-gray-500'>{tenants.length} total tenants</p>
        </div>
        <Link href='/admin/tenants/new'>
          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Add Tenant
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <Input
          placeholder='Search by name, flat, or mobile...'
          className='pl-10'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tenants List */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          title='No tenants found'
          description={
            searchQuery
              ? "Try a different search term"
              : "Add your first tenant to get started"
          }
          action={
            !searchQuery && (
              <Link href='/admin/tenants/new'>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Tenant
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className='grid gap-4'>
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} variant='bordered'>
              <CardContent className='py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center'>
                      <span className='text-indigo-600 font-semibold text-lg'>
                        {tenant.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-semibold text-gray-900'>
                          {tenant.full_name}
                        </h3>
                        <Badge
                          variant={tenant.is_active ? "success" : "danger"}
                        >
                          {tenant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-500'>
                        Flat {tenant.flat_number} •{" "}
                        {getBHKLabel(tenant.bhk_type)} •
                        {formatCurrency(tenant.monthly_rent)}/month
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        Since {formatDate(tenant.rent_start_date)} •{" "}
                        {tenant.mobile_number}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Link href={`/admin/tenants/${tenant.id}`}>
                      <Button variant='ghost' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </Link>
                    <Link href={`/admin/tenants/${tenant.id}/edit`}>
                      <Button variant='ghost' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </Link>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setDeleteId(tenant.id)}
                      disabled={!tenant.is_active}
                    >
                      <Trash2 className='h-4 w-4 text-red-500' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Deactivate Tenant'
        message='Are you sure you want to deactivate this tenant? Their bills and history will be preserved.'
        confirmText='Deactivate'
        isLoading={isDeleting}
      />
    </div>
  );
}
