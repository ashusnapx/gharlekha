"use client";

import { TenantLayout } from "@/components/layout";

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TenantLayout>{children}</TenantLayout>;
}
