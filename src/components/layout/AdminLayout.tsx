"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gauge,
  FileText,
  Receipt,
  StickyNote,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CONFIG } from "@/config/config";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Users },
  { href: "/admin/meter-readings", label: "Meter Readings", icon: Gauge },
  { href: "/admin/billing", label: "Billing", icon: FileText },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/notes", label: "Notes", icon: StickyNote },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    addToast({ type: "success", title: "Logged out successfully" });
    router.push("/login");
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className='flex flex-col h-full'>
          {/* Logo */}
          <div className='flex items-center justify-between h-16 px-6 border-b border-gray-200'>
            <Link href='/admin/dashboard' className='flex items-center gap-3'>
              <div className='relative h-8 w-8'>
                <Image
                  src='/logo.png'
                  alt={CONFIG.app.name}
                  fill
                  className='object-contain'
                />
              </div>
              <span className='text-lg font-bold text-gray-900'>
                {CONFIG.app.name}
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className='lg:hidden p-1 rounded-lg hover:bg-gray-100'
            >
              <X className='h-5 w-5 text-gray-500' />
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-1 overflow-y-auto'>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-indigo-600" : "text-gray-400"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className='p-4 border-t border-gray-200'>
            <button
              onClick={handleLogout}
              className='flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
            >
              <LogOut className='h-5 w-5 text-gray-400' />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top bar */}
        <header className='sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-4'
          >
            <Menu className='h-5 w-5 text-gray-600' />
          </button>
          <div className='flex-1' />
          <span className='text-sm text-gray-500'>Admin Portal</span>
        </header>

        {/* Page content */}
        <main className='p-4 lg:p-8'>{children}</main>
      </div>
    </div>
  );
}
