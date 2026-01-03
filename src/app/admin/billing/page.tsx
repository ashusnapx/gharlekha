"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  useToast,
} from "@/components/ui";
import {
  formatCurrency,
  formatNumber,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
  formatMonthYear,
  calculateElectricityAmount,
  calculateBillTotal,
  generateBillNumber,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CONFIG } from "@/config/config";
import type { Tenant, Bill, MeterReading } from "@/types";

const monthOptions = getMonthOptions().map((m) => ({
  value: m.value,
  label: m.label,
}));
const yearOptions = getYearOptions().map((y) => ({
  value: y.value,
  label: y.label,
}));

export default function BillingPage() {
  const { addToast } = useToast();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bills, setBills] = useState<Record<string, Bill>>({});
  const [readings, setReadings] = useState<Record<string, MeterReading>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Get active tenants
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("*")
        .eq("is_active", true)
        .order("flat_number");

      setTenants(tenantsData || []);

      // Get bills for selected month
      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      const billsMap: Record<string, Bill> = {};
      billsData?.forEach((b) => {
        billsMap[b.tenant_id] = b;
      });
      setBills(billsMap);

      // Get readings for selected month
      const { data: readingsData } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      const readingsMap: Record<string, MeterReading> = {};
      readingsData?.forEach((r) => {
        readingsMap[r.tenant_id] = r;
      });
      setReadings(readingsMap);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast({ type: "error", title: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBill = async (tenant: Tenant) => {
    const reading = readings[tenant.id];

    if (!reading || reading.units_consumed === null) {
      addToast({
        type: "error",
        title: "Cannot generate bill",
        message: "Meter reading is required for this tenant",
      });
      return;
    }

    setIsGenerating(tenant.id);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const electricityUnits = reading.units_consumed;
      const electricityRate = CONFIG.billing.electricityRatePerUnit;
      const electricityAmount = calculateElectricityAmount(
        electricityUnits,
        electricityRate
      );
      const waterAmount = CONFIG.billing.defaultWaterCharges;
      const totalAmount = calculateBillTotal(
        tenant.monthly_rent,
        electricityAmount,
        waterAmount
      );

      const billNumber = generateBillNumber(
        tenant.flat_number,
        selectedMonth,
        selectedYear
      );

      const lineItems = [
        { description: "Monthly Rent", amount: tenant.monthly_rent },
        {
          description: "Electricity",
          amount: electricityAmount,
          details: `${formatNumber(
            electricityUnits
          )} units × ₹${electricityRate}`,
        },
        { description: "Water Charges", amount: waterAmount },
      ];

      const { data: bill, error } = await supabase
        .from("bills")
        .insert({
          tenant_id: tenant.id,
          meter_reading_id: reading.id,
          month: selectedMonth,
          year: selectedYear,
          rent_amount: tenant.monthly_rent,
          electricity_units: electricityUnits,
          electricity_rate: electricityRate,
          electricity_amount: electricityAmount,
          water_amount: waterAmount,
          other_charges: 0,
          total_amount: totalAmount,
          payment_status: "pending",
          bill_number: billNumber,
          generated_by: user?.id,
          line_items: lineItems,
        })
        .select()
        .single();

      if (error) throw error;

      setBills({ ...bills, [tenant.id]: bill });
      addToast({ type: "success", title: "Bill generated successfully" });
    } catch (error) {
      console.error("Error generating bill:", error);
      addToast({ type: "error", title: "Failed to generate bill" });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleMarkAsPaid = async (billId: string, tenantId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bills")
        .update({
          payment_status: "paid",
          payment_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", billId);

      if (error) throw error;

      setBills({
        ...bills,
        [tenantId]: { ...bills[tenantId], payment_status: "paid" },
      });
      addToast({ type: "success", title: "Bill marked as paid" });
    } catch (error) {
      console.error("Error updating bill:", error);
      addToast({ type: "error", title: "Failed to update bill" });
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
        <h1 className='text-2xl font-bold text-gray-900'>Billing</h1>
        <p className='text-gray-500'>Generate and manage monthly bills</p>
      </div>

      {/* Filters */}
      <div className='flex gap-2'>
        <Select
          options={monthOptions}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className='w-36'
        />
        <Select
          options={yearOptions}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className='w-28'
        />
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Total Bills</p>
            <p className='text-2xl font-bold text-gray-900'>
              {Object.keys(bills).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Total Amount</p>
            <p className='text-2xl font-bold text-gray-900'>
              {formatCurrency(
                Object.values(bills).reduce(
                  (sum, b) => sum + Number(b.total_amount),
                  0
                )
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='py-4'>
            <p className='text-sm text-gray-500'>Pending</p>
            <p className='text-2xl font-bold text-yellow-600'>
              {
                Object.values(bills).filter(
                  (b) => b.payment_status === "pending"
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Grid */}
      {tenants.length === 0 ? (
        <EmptyState
          title='No tenants found'
          description='Add tenants first to generate bills'
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {formatMonthYear(selectedMonth, selectedYear)} Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='py-3 px-4 text-left text-sm font-medium text-gray-500'>
                      Flat
                    </th>
                    <th className='py-3 px-4 text-left text-sm font-medium text-gray-500'>
                      Tenant
                    </th>
                    <th className='py-3 px-4 text-right text-sm font-medium text-gray-500'>
                      Units
                    </th>
                    <th className='py-3 px-4 text-right text-sm font-medium text-gray-500'>
                      Amount
                    </th>
                    <th className='py-3 px-4 text-center text-sm font-medium text-gray-500'>
                      Status
                    </th>
                    <th className='py-3 px-4 text-center text-sm font-medium text-gray-500'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => {
                    const bill = bills[tenant.id];
                    const reading = readings[tenant.id];
                    const hasReading =
                      reading && reading.units_consumed !== null;

                    return (
                      <tr
                        key={tenant.id}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='py-3 px-4'>
                          <span className='font-medium text-gray-900'>
                            {tenant.flat_number}
                          </span>
                        </td>
                        <td className='py-3 px-4 text-gray-600'>
                          {tenant.full_name}
                        </td>
                        <td className='py-3 px-4 text-right text-gray-600'>
                          {hasReading
                            ? formatNumber(reading.units_consumed!)
                            : "—"}
                        </td>
                        <td className='py-3 px-4 text-right'>
                          {bill ? (
                            <span className='font-medium text-gray-900'>
                              {formatCurrency(bill.total_amount)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className='py-3 px-4 text-center'>
                          {bill ? (
                            getStatusBadge(bill.payment_status)
                          ) : (
                            <Badge variant='outline'>Not Generated</Badge>
                          )}
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex items-center justify-center gap-2'>
                            {bill ? (
                              <>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => setPreviewBill(bill)}
                                >
                                  <Eye className='h-4 w-4' />
                                </Button>
                                {bill.payment_status === "pending" && (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() =>
                                      handleMarkAsPaid(bill.id, tenant.id)
                                    }
                                  >
                                    <CheckCircle className='h-4 w-4 mr-1' />
                                    Paid
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                size='sm'
                                onClick={() => handleGenerateBill(tenant)}
                                isLoading={isGenerating === tenant.id}
                                disabled={!hasReading}
                              >
                                <FileText className='h-4 w-4 mr-1' />
                                Generate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bill Preview Modal */}
      <Modal
        isOpen={!!previewBill}
        onClose={() => setPreviewBill(null)}
        title='Bill Details'
        size='lg'
      >
        {previewBill && (
          <div className='space-y-4'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='text-sm text-gray-500'>Bill Number</p>
                <p className='font-medium'>{previewBill.bill_number}</p>
              </div>
              {getStatusBadge(previewBill.payment_status)}
            </div>

            <div className='border-t pt-4 space-y-2'>
              {(
                previewBill.line_items as Array<{
                  description: string;
                  amount: number;
                  details?: string;
                }>
              ).map((item, i) => (
                <div key={i} className='flex justify-between'>
                  <div>
                    <span className='text-gray-700'>{item.description}</span>
                    {item.details && (
                      <span className='text-sm text-gray-500 ml-2'>
                        ({item.details})
                      </span>
                    )}
                  </div>
                  <span className='font-medium'>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              <div className='flex justify-between pt-2 border-t font-bold'>
                <span>Total</span>
                <span>{formatCurrency(previewBill.total_amount)}</span>
              </div>
            </div>

            <div className='flex gap-3 pt-4'>
              <Button
                className='flex-1'
                variant='outline'
                onClick={() => setPreviewBill(null)}
              >
                Close
              </Button>
              <Link
                href={`/api/bills/${previewBill.id}/pdf`}
                target='_blank'
                className='flex-1'
              >
                <Button className='w-full'>
                  <Download className='h-4 w-4 mr-2' />
                  Download PDF
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
