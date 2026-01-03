"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Save } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  EmptyState,
  useToast,
} from "@/components/ui";
import {
  formatNumber,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
  formatMonthYear,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CONFIG } from "@/config/config";
import type { Tenant, MeterReading } from "@/types";

const monthOptions = getMonthOptions().map((m) => ({
  value: m.value,
  label: m.label,
}));
const yearOptions = getYearOptions().map((y) => ({
  value: y.value,
  label: y.label,
}));

export default function MeterReadingsPage() {
  const { addToast } = useToast();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [readings, setReadings] = useState<Record<string, MeterReading>>({});
  const [previousReadings, setPreviousReadings] = useState<
    Record<string, number>
  >({});
  const [newReadings, setNewReadings] = useState<Record<string, string>>({});
  const [manualPrevReadings, setManualPrevReadings] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");

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

      // Get previous month readings
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const { data: prevReadingsData } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("month", prevMonth)
        .eq("year", prevYear);

      const prevMap: Record<string, number> = {};
      prevReadingsData?.forEach((r) => {
        prevMap[r.tenant_id] = r.reading_value;
      });
      setPreviousReadings(prevMap);

      // Initialize new readings with existing values
      const newReadingsInit: Record<string, string> = {};
      tenantsData?.forEach((t) => {
        const existing = readingsMap[t.id];
        newReadingsInit[t.id] = existing
          ? existing.reading_value.toString()
          : "";
      });
      setNewReadings(newReadingsInit);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast({ type: "error", title: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReading = async (tenantId: string) => {
    const readingValue = Number(newReadings[tenantId]);
    const prevReadingFromDB = previousReadings[tenantId];
    // Use DB history if available, otherwise use manual input (defaults to 0)
    const prevReading =
      prevReadingFromDB !== undefined
        ? prevReadingFromDB
        : Number(manualPrevReadings[tenantId] || 0);

    if (!readingValue || readingValue < 0) {
      addToast({ type: "error", title: "Invalid reading value" });
      return;
    }

    if (readingValue < prevReading) {
      addToast({
        type: "error",
        title: "Invalid reading",
        message: `Current reading must be ≥ previous reading (${formatNumber(
          prevReading
        )})`,
      });
      return;
    }

    setIsSaving(tenantId);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Calculation logic uses the determined prevReading
      const unitsConsumed = readingValue - prevReading;

      const existing = readings[tenantId];

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("meter_readings")
          .update({
            reading_value: readingValue,
            units_consumed: unitsConsumed,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("meter_readings").insert({
          tenant_id: tenantId,
          reading_value: readingValue,
          reading_date: new Date().toISOString().split("T")[0],
          month: selectedMonth,
          year: selectedYear,
          units_consumed: unitsConsumed,
          recorded_by: user?.id,
        });

        if (error) throw error;
      }

      addToast({ type: "success", title: "Reading saved" });
      loadData();
    } catch (error) {
      console.error("Error saving reading:", error);
      addToast({ type: "error", title: "Failed to save reading" });
    } finally {
      setIsSaving(null);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.flat_number.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Meter Readings</h1>
        <p className='text-gray-500'>
          Record monthly electricity meter readings
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
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
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search by name or flat...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Info Card */}
      <Card className='bg-indigo-50 border-indigo-100'>
        <CardContent className='py-4'>
          <p className='text-sm text-indigo-700'>
            <strong>Rate:</strong> {CONFIG.currency.symbol}
            {CONFIG.billing.electricityRatePerUnit} per unit |
            <strong className='ml-2'>Period:</strong>{" "}
            {formatMonthYear(selectedMonth, selectedYear)}
          </p>
        </CardContent>
      </Card>

      {/* Readings Grid */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          title='No tenants found'
          description='Add tenants first to record meter readings'
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Enter Readings</CardTitle>
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
                      Previous
                    </th>
                    <th className='py-3 px-4 text-right text-sm font-medium text-gray-500'>
                      Current
                    </th>
                    <th className='py-3 px-4 text-right text-sm font-medium text-gray-500'>
                      Units
                    </th>
                    <th className='py-3 px-4 text-center text-sm font-medium text-gray-500'>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => {
                    const prevReadingFromDB = previousReadings[tenant.id];
                    const hasHistory = prevReadingFromDB !== undefined;
                    const existingRecord = readings[tenant.id];

                    // Determine the effective previous reading for display and calculation
                    let effectivePrevReadingForDisplay: number | string = 0;
                    let effectivePrevReadingForCalc: number = 0;

                    if (hasHistory) {
                      effectivePrevReadingForDisplay = prevReadingFromDB;
                      effectivePrevReadingForCalc = prevReadingFromDB;
                    } else if (
                      existingRecord &&
                      existingRecord.units_consumed !== null
                    ) {
                      // If there's an existing record for this month, back-calculate prev
                      const calculatedPrev =
                        existingRecord.reading_value -
                        existingRecord.units_consumed;
                      effectivePrevReadingForDisplay = calculatedPrev;
                      effectivePrevReadingForCalc = calculatedPrev;
                    } else {
                      // No history, no existing record, use manual input
                      effectivePrevReadingForDisplay =
                        manualPrevReadings[tenant.id] || "0";
                      effectivePrevReadingForCalc = Number(
                        manualPrevReadings[tenant.id] || "0"
                      );
                    }

                    const currentValue = Number(newReadings[tenant.id]);

                    // Only calculate if user has entered a value
                    const units = newReadings[tenant.id]
                      ? currentValue - effectivePrevReadingForCalc
                      : null;

                    const hasExisting = !!readings[tenant.id];

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
                        <td className='py-3 px-4 text-right text-gray-500'>
                          {hasHistory ? (
                            formatNumber(
                              effectivePrevReadingForDisplay as number
                            )
                          ) : (
                            <Input
                              type='number'
                              placeholder='Initial'
                              className='w-24 text-right ml-auto'
                              value={effectivePrevReadingForDisplay}
                              onChange={(e) =>
                                setManualPrevReadings({
                                  ...manualPrevReadings,
                                  [tenant.id]: e.target.value,
                                })
                              }
                              min={0}
                            />
                          )}
                        </td>
                        <td className='py-3 px-4'>
                          <Input
                            type='number'
                            placeholder='Enter reading'
                            className='w-32 text-right ml-auto'
                            value={newReadings[tenant.id]}
                            onChange={(e) =>
                              setNewReadings({
                                ...newReadings,
                                [tenant.id]: e.target.value,
                              })
                            }
                            min={effectivePrevReadingForCalc}
                          />
                        </td>
                        <td className='py-3 px-4 text-right'>
                          <span className='font-medium text-gray-900'>
                            {units !== null ? formatNumber(units) : "—"}
                          </span>
                        </td>
                        <td className='py-3 px-4 text-center'>
                          <Button
                            size='sm'
                            variant={hasExisting ? "outline" : "primary"}
                            onClick={() => handleSaveReading(tenant.id)}
                            isLoading={isSaving === tenant.id}
                            disabled={
                              !newReadings[tenant.id] ||
                              (!hasHistory && !manualPrevReadings[tenant.id])
                            }
                          >
                            <Save className='h-4 w-4 mr-1' />
                            {hasExisting ? "Update" : "Save"}
                          </Button>
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
    </div>
  );
}
