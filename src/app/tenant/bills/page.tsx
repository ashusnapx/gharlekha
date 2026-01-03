"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, formatMonthYear, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Bill } from "@/types";

export default function TenantBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!tenant) {
        setIsLoading(false);
        return;
      }

      // Get all bills
      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      setBills(billsData || []);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant='success'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant='warning'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant='danger'>
            <AlertCircle className='h-3 w-3 mr-1' />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant='default'>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>My Bills</h1>
        <p className='text-gray-500'>View and download your rental bills</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Total Bills</p>
            <p className='text-2xl font-bold text-gray-900'>{bills.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Total Paid</p>
            <p className='text-2xl font-bold text-green-600'>
              {formatCurrency(
                bills
                  .filter((b) => b.payment_status === "paid")
                  .reduce((sum, b) => sum + Number(b.total_amount), 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Pending</p>
            <p className='text-2xl font-bold text-yellow-600'>
              {formatCurrency(
                bills
                  .filter((b) => b.payment_status === "pending")
                  .reduce((sum, b) => sum + Number(b.total_amount), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <EmptyState
          icon={<FileText className='h-12 w-12' />}
          title='No bills yet'
          description='Your monthly bills will appear here once generated'
        />
      ) : (
        <div className='space-y-4'>
          {bills.map((bill) => (
            <Card key={bill.id} variant='bordered'>
              <CardContent className='py-4'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='font-semibold text-gray-900'>
                        {formatMonthYear(bill.month, bill.year)}
                      </h3>
                      {getStatusBadge(bill.payment_status)}
                    </div>
                    <p className='text-sm text-gray-500'>
                      Bill #{bill.bill_number}
                    </p>
                  </div>

                  <div className='flex flex-wrap items-center gap-4'>
                    <div className='grid grid-cols-3 gap-4 text-center'>
                      <div>
                        <p className='text-xs text-gray-500'>Rent</p>
                        <p className='font-medium'>
                          {formatCurrency(bill.rent_amount)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Electricity</p>
                        <p className='font-medium'>
                          {formatCurrency(bill.electricity_amount)}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {formatNumber(bill.electricity_units)} units
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Water</p>
                        <p className='font-medium'>
                          {formatCurrency(bill.water_amount)}
                        </p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <p className='text-xs text-gray-500'>Total</p>
                      <p className='text-xl font-bold text-gray-900'>
                        {formatCurrency(bill.total_amount)}
                      </p>
                    </div>

                    <Link href={`/api/bills/${bill.id}/pdf`} target='_blank'>
                      <Button>
                        <Download className='h-4 w-4 mr-2' />
                        Download
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
