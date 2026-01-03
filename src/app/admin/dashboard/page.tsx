"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ArrowRight,
  Activity,
  Calendar,
  Wallet,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Button,
} from "@/components/ui";
import {
  formatCurrency,
  formatMonthYear,
  getCurrentMonthYear,
  cn,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// --- Types ---
interface RecentActivityItem {
  id: string;
  type: "bill_generated" | "payment_received" | "tenant_joined";
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  status?: "paid" | "pending" | "overdue";
}

interface ExtendedDashboardSummary extends DashboardSummary {
  recentActivity: RecentActivityItem[];
  landlordName?: string;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<ExtendedDashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    loadDashboardData();
    setGreeting(getTimeBasedGreeting());
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      const { month, year } = getCurrentMonthYear();

      // Parallel data fetching for speed
      const [
        tenantsResponse,
        activeTenantsResponse,
        currentMonthBillsResponse,
        allBillsResponse,
        pendingBillsResponse,
        expensesResponse,
        userProfileResponse,
        recentBillsResponse,
      ] = await Promise.all([
        supabase.from("tenants").select("*", { count: "exact", head: true }),
        supabase
          .from("tenants")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("bills")
          .select("total_amount, payment_status")
          .eq("month", month)
          .eq("year", year),
        supabase.from("bills").select("total_amount, payment_status"),
        supabase
          .from("bills")
          .select("total_amount")
          .eq("payment_status", "pending"),
        supabase.from("expenses").select("amount"),
        supabase.auth
          .getUser()
          .then((u) =>
            u.data.user?.id
              ? supabase
                  .from("profiles")
                  .select("landlord_code, full_name")
                  .eq("id", u.data.user.id)
                  .single()
              : { data: null }
          ),
        supabase
          .from("bills")
          .select(
            `
            id,
            total_amount,
            payment_status,
            created_at,
            tenants (full_name)
          `
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Process Data
      const currentMonthIncome =
        currentMonthBillsResponse.data?.reduce(
          (sum, bill) =>
            sum +
            (bill.payment_status === "paid" ? Number(bill.total_amount) : 0),
          0
        ) || 0;

      const allTimeIncome =
        allBillsResponse.data?.reduce(
          (sum, bill) =>
            sum +
            (bill.payment_status === "paid" ? Number(bill.total_amount) : 0),
          0
        ) || 0;

      const overdueAmount =
        pendingBillsResponse.data?.reduce(
          (sum, bill) => sum + Number(bill.total_amount),
          0
        ) || 0;

      const totalExpenses =
        expensesResponse.data?.reduce(
          (sum, exp) => sum + Number(exp.amount),
          0
        ) || 0;

      // Process Recent Activity
      const recentActivity: RecentActivityItem[] =
        recentBillsResponse.data?.map((bill: any) => ({
          id: bill.id,
          type: "bill_generated",
          title: `Bill for ${bill.tenants?.full_name || "Unknown Tenant"}`,
          subtitle: `Status: ${bill.payment_status}`,
          amount: Number(bill.total_amount),
          date: bill.created_at,
          status: bill.payment_status,
        })) || [];

      setSummary({
        currentMonthIncome,
        allTimeIncome,
        totalExpenses,
        netEarnings: allTimeIncome - totalExpenses,
        totalTenants: tenantsResponse.count || 0,
        activeTenants: activeTenantsResponse.count || 0,
        pendingBills: pendingBillsResponse.data?.length || 0,
        overdueAmount,
        landlordCode: userProfileResponse.data?.landlord_code,
        landlordName: userProfileResponse.data?.full_name,
        recentActivity,
      });

      // Monthly Data (Chart) - Fetched sequentially to avoid complex Promise.all logic for loop
      // Optimizing: Could be parallelized but loop is small (6)
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

  const copyToClipboard = () => {
    if (summary?.landlordCode) {
      navigator.clipboard.writeText(summary.landlordCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-4'>
          <Spinner size='lg' className='text-indigo-600' />
          <p className='text-gray-500 animate-pulse'>Loading your empire...</p>
        </div>
      </div>
    );
  }

  const { month, year } = getCurrentMonthYear();
  const hasTenants = (summary?.totalTenants || 0) > 0;

  // Occupancy Data for Pie Chart
  const occupancyData = [
    { name: "Occupied", value: summary?.activeTenants || 0, color: "#6366f1" }, // Indigo-500
    {
      name: "Vacant",
      value: (summary?.totalTenants || 0) - (summary?.activeTenants || 0),
      color: "#e2e8f0",
    }, // Slate-200
  ];

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={containerVariants}
      className='space-y-8 max-w-[1600px] mx-auto'
    >
      {/* --- Top Header with Greeting & Code --- */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
        <motion.div variants={itemVariants}>
          <h1 className='text-3xl font-extrabold text-gray-900 tracking-tight'>
            {greeting},{" "}
            {summary?.landlordName
              ? summary.landlordName.split(" ")[0]
              : "Landlord"}
            ! ☀️
          </h1>
          <p className='text-gray-500 mt-1 flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Financial Overview for {formatMonthYear(month, year)}
          </p>
        </motion.div>

        {/* Landlord Code Card - Improved */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className='group relative flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300'
        >
          <div className='flex flex-col'>
            <span className='text-[10px] font-bold text-indigo-500 uppercase tracking-widest'>
              Property Access Code
            </span>
            <div className='flex items-baseline gap-2'>
              <code className='text-3xl font-bold text-gray-900 tracking-widest font-mono'>
                {summary?.landlordCode ?? "..."}
              </code>
            </div>
          </div>
          <div className='h-10 w-px bg-gray-100 mx-2'></div>
          <Button
            onClick={copyToClipboard}
            variant='ghost'
            size='icon'
            className={cn(
              "rounded-xl transition-all duration-300 h-10 w-10",
              copied
                ? "bg-green-100 text-green-700"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            )}
          >
            {copied ? (
              <Check className='h-5 w-5' />
            ) : (
              <Copy className='h-5 w-5' />
            )}
          </Button>
        </motion.div>
      </div>

      {!hasTenants ? (
        /* --- Welcome Hero (Empty State) --- */
        <motion.div
          variants={itemVariants}
          className='bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 md:p-16 text-white shadow-2xl relative overflow-hidden'
        >
          {/* Decorative Elements */}
          <div className='absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 bg-white/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 bg-black/20 rounded-full blur-3xl'></div>

          <div className='relative z-10 max-w-3xl'>
            <h2 className='text-4xl md:text-5xl font-extrabold mb-6 tracking-tight'>
              Everything starts with <br /> your first tenant. 🚀
            </h2>
            <p className='text-indigo-100 text-xl mb-12 leading-relaxed max-w-xl'>
              Ghar Lekha is ready to automate your rental chaos. Setup only
              takes 2 minutes. Follow this quick checklist to generate your
              first professional bill.
            </p>

            <div className='grid md:grid-cols-3 gap-6'>
              <Link href='/admin/tenants/new' className='group'>
                <div className='bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 h-full flex flex-col'>
                  <div className='h-12 w-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform'>
                    1
                  </div>
                  <h3 className='font-bold text-lg text-white mb-2'>
                    Add Tenant
                  </h3>
                  <p className='text-indigo-200 text-sm mb-4 flex-1'>
                    Create a profile for your tenant and flat details.
                  </p>
                  <div className='flex items-center text-white font-semibold text-sm'>
                    Start Now{" "}
                    <ArrowRight className='h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform' />
                  </div>
                </div>
              </Link>

              <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 h-full flex flex-col opacity-80 hover:opacity-100 transition-opacity'>
                <div className='h-12 w-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xl mb-4'>
                  2
                </div>
                <h3 className='font-bold text-lg text-white mb-2'>
                  Share Code
                </h3>
                <p className='text-indigo-200 text-sm'>
                  Give the code{" "}
                  <span className='font-mono bg-white/20 px-2 py-0.5 rounded text-white'>
                    {summary?.landlordCode}
                  </span>{" "}
                  to your tenant to link app.
                </p>
              </div>

              <div className='bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 h-full flex flex-col opacity-80 hover:opacity-100 transition-opacity'>
                <div className='h-12 w-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xl mb-4'>
                  3
                </div>
                <h3 className='font-bold text-lg text-white mb-2'>
                  First Bill
                </h3>
                <p className='text-indigo-200 text-sm'>
                  Record meter reading and generate PDF instantly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* --- Main Dashboard Logic --- */
        <>
          {/* Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[
              {
                label: "Current Month Income",
                value: summary?.currentMonthIncome || 0,
                icon: TrendingUp,
                color: "text-green-600",
                bg: "bg-green-50",
                border: "border-green-100",
              },
              {
                label: "All-Time Income",
                value: summary?.allTimeIncome || 0,
                icon: DollarSign,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
                border: "border-indigo-100",
              },
              {
                label: "Pending Dues",
                value: summary?.overdueAmount || 0,
                icon: AlertCircle,
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-100",
              },
              {
                label: "Net Profit",
                value: summary?.netEarnings || 0,
                icon: Wallet,
                color:
                  (summary?.netEarnings || 0) >= 0
                    ? "text-emerald-600"
                    : "text-rose-600",
                bg:
                  (summary?.netEarnings || 0) >= 0
                    ? "bg-emerald-50"
                    : "bg-rose-50",
                border:
                  (summary?.netEarnings || 0) >= 0
                    ? "border-emerald-100"
                    : "border-rose-100",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <Card
                  className={cn(
                    "border-l-4 overflow-hidden",
                    stat.border,
                    stat.color.replace("text", "border")
                  )}
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div
                        className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          stat.bg
                        )}
                      >
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                      {index === 0 && (
                        <span className='text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                          +12%
                        </span>
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-500 mb-1'>
                        {stat.label}
                      </p>
                      <h3 className='text-3xl font-bold text-gray-900'>
                        {formatCurrency(stat.value)}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Financial Chart */}
            <motion.div variants={itemVariants} className='lg:col-span-2'>
              <Card className='h-full border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5 text-indigo-500' />
                    Financial Performance
                  </CardTitle>
                  <SelectTimeframe /> {/* Component Placeholder */}
                </CardHeader>
                <CardContent>
                  <div className='h-[400px] w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id='colorIncome'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                          >
                            <stop
                              offset='5%'
                              stopColor='#6366f1'
                              stopOpacity={0.3}
                            />
                            <stop
                              offset='95%'
                              stopColor='#6366f1'
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id='colorExpenses'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                          >
                            <stop
                              offset='5%'
                              stopColor='#f43f5e'
                              stopOpacity={0.3}
                            />
                            <stop
                              offset='95%'
                              stopColor='#f43f5e'
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray='3 3'
                          stroke='#f1f5f9'
                          vertical={false}
                        />
                        <XAxis
                          dataKey='monthLabel'
                          tick={{ fontSize: 12, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#94a3b8" }}
                          tickFormatter={(value) => `₹${value / 1000}k`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Legend iconType='circle' />
                        <Area
                          type='monotone'
                          dataKey='income'
                          name='Income'
                          stroke='#6366f1'
                          strokeWidth={3}
                          fillOpacity={1}
                          fill='url(#colorIncome)'
                        />
                        <Area
                          type='monotone'
                          dataKey='expenses'
                          name='Expenses'
                          stroke='#f43f5e'
                          strokeWidth={3}
                          fillOpacity={1}
                          fill='url(#colorExpenses)'
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar Column */}
            <div className='space-y-8'>
              {/* Occupancy Status */}
              <motion.div variants={itemVariants}>
                <Card className='border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <PieChartIcon className='h-5 w-5 text-indigo-500' />
                      Occupancy Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='h-64 relative flex items-center justify-center'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={occupancyData}
                            cx='50%'
                            cy='50%'
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey='value'
                          >
                            {occupancyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Text */}
                      <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                        <span className='text-3xl font-bold text-gray-900'>
                          {summary?.activeTenants}
                        </span>
                        <span className='text-xs text-gray-500 uppercase font-semibold'>
                          Occupied
                        </span>
                      </div>
                    </div>
                    <div className='flex justify-between items-center text-sm px-4 md:px-8'>
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 rounded-full bg-indigo-500'></div>
                        <span className='text-gray-600'>
                          Occupied ({summary?.activeTenants})
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 rounded-full bg-slate-200'></div>
                        <span className='text-gray-600'>
                          Vacant (
                          {(summary?.totalTenants || 0) -
                            (summary?.activeTenants || 0)}
                          )
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants}>
                <Card className='border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Activity className='h-5 w-5 text-orange-500' />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {summary?.recentActivity &&
                      summary.recentActivity.length > 0 ? (
                        summary.recentActivity.map((activity, i) => (
                          <div
                            key={i}
                            className='flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors'
                          >
                            <div
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border",
                                activity.status === "paid"
                                  ? "bg-green-50 border-green-100 text-green-600"
                                  : "bg-yellow-50 border-yellow-100 text-yellow-600"
                              )}
                            >
                              {activity.status === "paid" ? (
                                <Check className='h-5 w-5' />
                              ) : (
                                <Activity className='h-5 w-5' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold text-gray-900 truncate'>
                                {activity.title}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-sm font-bold text-gray-900'>
                                {formatCurrency(activity.amount || 0)}
                              </p>
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                                  activity.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                )}
                              >
                                {activity.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className='text-center py-8 text-gray-500'>
                          <p>No recent activity.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// Simple Helper Component
function SelectTimeframe() {
  return (
    <select className='text-sm border-none bg-gray-50 rounded-lg px-2 py-1 text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors'>
      <option value='6m'>Last 6 Months</option>
      <option value='ytd'>Year to Date</option>
      <option value='1y'>Last Year</option>
    </select>
  );
}
