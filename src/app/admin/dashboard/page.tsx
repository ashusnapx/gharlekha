"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/ui";
import {
  formatCurrency,
  formatMonthYear,
  getCurrentMonthYear,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { DashboardSummary, MonthlyIncome } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      const { month, year } = getCurrentMonthYear();

      // Get tenants count
      const { count: totalTenants } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });

      const { count: activeTenants } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get current month income
      const { data: currentMonthBills } = await supabase
        .from("bills")
        .select("total_amount, payment_status")
        .eq("month", month)
        .eq("year", year);

      const currentMonthIncome =
        currentMonthBills?.reduce(
          (sum, bill) =>
            sum +
            (bill.payment_status === "paid" ? Number(bill.total_amount) : 0),
          0
        ) || 0;

      // Get all-time income
      const { data: allBills } = await supabase
        .from("bills")
        .select("total_amount, payment_status");

      const allTimeIncome =
        allBills?.reduce(
          (sum, bill) =>
            sum +
            (bill.payment_status === "paid" ? Number(bill.total_amount) : 0),
          0
        ) || 0;

      // Get pending bills
      const { data: pendingBills } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("payment_status", "pending");

      const overdueAmount =
        pendingBills?.reduce(
          (sum, bill) => sum + Number(bill.total_amount),
          0
        ) || 0;

      // Get total expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount");

      const totalExpenses =
        expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      let landlordCode = undefined;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("landlord_code")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();
        landlordCode = profile?.landlord_code;
      } catch (err) {
        console.warn("Failed to fetch landlord code", err);
      }

      setSummary({
        currentMonthIncome,
        allTimeIncome,
        totalExpenses,
        netEarnings: allTimeIncome - totalExpenses,
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        pendingBills: pendingBills?.length || 0,
        overdueAmount,
        landlordCode,
      });

      // Get monthly data for chart (last 6 months)
      const monthlyIncomeData: MonthlyIncome[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const { data: monthBills } = await supabase
          .from("bills")
          .select("total_amount, payment_status")
          .eq("month", m)
          .eq("year", y);

        const { data: monthExpenses } = await supabase
          .from("expenses")
          .select("amount")
          .gte("date", `${y}-${String(m).padStart(2, "0")}-01`)
          .lt(
            "date",
            m === 12
              ? `${y + 1}-01-01`
              : `${y}-${String(m + 1).padStart(2, "0")}-01`
          );

        const income =
          monthBills?.reduce(
            (sum, bill) =>
              sum +
              (bill.payment_status === "paid" ? Number(bill.total_amount) : 0),
            0
          ) || 0;

        const exp =
          monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        monthlyIncomeData.push({
          month: m,
          year: y,
          monthLabel: formatMonthYear(m, y),
          income,
          expenses: exp,
          net: income - exp,
        });
      }
      setMonthlyData(monthlyIncomeData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
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

  const { month, year } = getCurrentMonthYear();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-gray-500'>
            {formatMonthYear(month, year)} Overview
          </p>
          <div className='mt-2 sm:mt-0 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100'>
            <span className='text-sm font-medium text-indigo-700'>
              Your Landlord Code:
            </span>
            <code className='text-lg font-bold text-indigo-900 tracking-wider font-mono'>
              {summary?.landlordCode ?? "Not Assigned"}
            </code>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  Current Month
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(summary?.currentMonthIncome || 0)}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  All-Time Income
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(summary?.allTimeIncome || 0)}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-indigo-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  Active Tenants
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {summary?.activeTenants} / {summary?.totalTenants}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  Pending Amount
                </p>
                <p className='text-2xl font-bold text-red-600'>
                  {formatCurrency(summary?.overdueAmount || 0)}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-red-100 flex items-center justify-center'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Earnings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Net Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <div className='flex items-baseline gap-2'>
                <span className='text-3xl font-bold text-gray-900'>
                  {formatCurrency(summary?.netEarnings || 0)}
                </span>
                {(summary?.netEarnings || 0) >= 0 ? (
                  <span className='flex items-center text-green-600 text-sm'>
                    <ArrowUp className='h-4 w-4' />
                    Profit
                  </span>
                ) : (
                  <span className='flex items-center text-red-600 text-sm'>
                    <ArrowDown className='h-4 w-4' />
                    Loss
                  </span>
                )}
              </div>
              <p className='text-sm text-gray-500 mt-1'>
                Total Income: {formatCurrency(summary?.allTimeIncome || 0)} |
                Total Expenses: {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                <XAxis
                  dataKey='monthLabel'
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(" ")[0].slice(0, 3)}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar
                  dataKey='income'
                  name='Income'
                  fill='#4f46e5'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='expenses'
                  name='Expenses'
                  fill='#ef4444'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
