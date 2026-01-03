"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  DollarSign,
  Zap,
  Droplets,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Spinner,
  EmptyState,
} from "@/components/ui";
import {
  formatCurrency,
  formatMonthYear,
  formatDate,
  getCurrentMonthYear,
  formatNumber,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Bill, Tenant } from "@/types";

export default function TenantDashboardPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get tenant profile
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!tenantData) {
        setIsLoading(false);
        return;
      }
      setTenant(tenantData);

      // Get current month bill
      const { data: currentBillData } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .eq("month", month)
        .eq("year", year)
        .single();

      setCurrentBill(currentBillData);

      // Get recent bills (last 5)
      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(5);

      setRecentBills(billsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
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

  if (!tenant) {
    return (
      <EmptyState
        title='Tenant profile not found'
        description='Your account is not linked to a tenant profile. Please contact your landlord.'
      />
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>
          Welcome, {tenant.full_name}!
        </h1>
        <p className='text-gray-500'>
          Flat {tenant.flat_number} • {formatMonthYear(month, year)}
        </p>
      </div>

      {/* Current Bill */}
      {currentBill ? (
        <Card className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white'>
          <CardContent className='py-6'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div>
                <p className='text-indigo-100 text-sm mb-1'>
                  Current Month Bill
                </p>
                <p className='text-3xl font-bold'>
                  {formatCurrency(currentBill.total_amount)}
                </p>
                <div className='mt-2'>
                  {getStatusBadge(currentBill.payment_status)}
                </div>
              </div>
              <Link href={`/api/bills/${currentBill.id}/pdf`} target='_blank'>
                <Button className='bg-white text-indigo-600 hover:bg-indigo-50'>
                  <Download className='h-4 w-4 mr-2' />
                  Download Bill
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='py-8 text-center'>
            <FileText className='h-12 w-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-500'>
              No bill generated yet for {formatMonthYear(month, year)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bill Breakdown */}
      {currentBill && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='py-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                  <DollarSign className='h-5 w-5 text-indigo-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Rent</p>
                  <p className='font-semibold text-gray-900'>
                    {formatCurrency(currentBill.rent_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='py-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center'>
                  <Zap className='h-5 w-5 text-yellow-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Electricity</p>
                  <p className='font-semibold text-gray-900'>
                    {formatCurrency(currentBill.electricity_amount)}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {formatNumber(currentBill.electricity_units)} units
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='py-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                  <Droplets className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Water</p>
                  <p className='font-semibold text-gray-900'>
                    {formatCurrency(currentBill.water_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='py-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center'>
                  <span className='text-green-600 font-bold'>Σ</span>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Total</p>
                  <p className='font-semibold text-gray-900'>
                    {formatCurrency(currentBill.total_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bills */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Recent Bills</CardTitle>
          <Link href='/tenant/bills'>
            <Button variant='ghost' size='sm'>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>No bills yet</p>
          ) : (
            <div className='divide-y divide-gray-100'>
              {recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className='py-3 flex items-center justify-between'
                >
                  <div>
                    <p className='font-medium text-gray-900'>
                      {formatMonthYear(bill.month, bill.year)}
                    </p>
                    <p className='text-sm text-gray-500'>{bill.bill_number}</p>
                  </div>
                  <div className='flex items-center gap-3'>
                    {getStatusBadge(bill.payment_status)}
                    <span className='font-semibold text-gray-900'>
                      {formatCurrency(bill.total_amount)}
                    </span>
                    <Link href={`/api/bills/${bill.id}/pdf`} target='_blank'>
                      <Button variant='ghost' size='sm'>
                        <Download className='h-4 w-4' />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
