"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Eye, EyeOff, User, ShieldCheck, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent, useToast } from "@/components/ui";
import { CONFIG } from "@/config/config";
import { loginSchema } from "@/lib/validators";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"tenant" | "admin">(
    "tenant"
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        addToast({
          type: "error",
          title: "Login Failed",
          message: error.message,
        });
        return;
      }

      if (data.user) {
        // Enforce Role Check
        const actualRole = data.user.user_metadata?.role || "tenant";

        if (selectedRole === "admin" && actualRole !== "admin") {
          await supabase.auth.signOut();
          addToast({
            type: "error",
            title: "Access Denied",
            message: "This account does not have Admin privileges.",
          });
          return;
        }

        // Allow Admin to login as Tenant if they want?
        // No, strict check is better for clarity, or just warn.
        // Let's stick to strict check for Admin role.
        // If Tenant tries to login as Tenant, allow.

        addToast({
          type: "success",
          title: `Welcome back, ${
            selectedRole === "admin" ? "Admin" : "Tenant"
          }!`,
        });
        router.push(
          actualRole === "admin" ? "/admin/dashboard" : "/tenant/dashboard"
        );
      }
    } catch (error) {
      addToast({ type: "error", title: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative flex items-center justify-center p-4 bg-gray-50 overflow-hidden'>
      {/* Decorative Vector Background */}
      <div className='absolute inset-0 z-0'>
        <svg
          className='absolute top-0 left-0 w-full h-full opacity-10'
          viewBox='0 0 100 100'
          preserveAspectRatio='none'
        >
          <path d='M0 0 L100 0 L100 100 L0 100 Z' fill='#ffffff' />
          <path
            d='M0 0 C30 10 70 10 100 0 L100 100 L0 100 Z'
            fill='url(#grad1)'
          />
          <defs>
            <linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop
                offset='0%'
                style={{ stopColor: "#4F46E5", stopOpacity: 1 }}
              />
              <stop
                offset='100%'
                style={{ stopColor: "#9333EA", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
        </svg>
        <div className='absolute -top-20 -right-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-20 -left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-500/30'>
            <Home className='h-8 w-8' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>
            {CONFIG.app.name}
          </h1>
          <p className='text-gray-500 mt-2 font-medium'>
            Rental Management System
          </p>
        </div>

        <Card
          variant='elevated'
          className='border-0 shadow-2xl shadow-indigo-100'
        >
          <CardContent className='py-8 px-8'>
            <div className='mb-8'>
              <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block'>
                Select Portal
              </label>
              <div className='grid grid-cols-2 gap-3 p-1 bg-gray-100/80 rounded-xl'>
                <button
                  type='button'
                  onClick={() => setSelectedRole("tenant")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedRole === "tenant"
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User className='h-4 w-4' />
                  Tenant
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedRole("admin")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedRole === "admin"
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ShieldCheck className='h-4 w-4' />
                  Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-5'>
              <Input
                label='Email Address'
                type='email'
                placeholder={
                  selectedRole === "admin"
                    ? "admin@gharlekha.com"
                    : "tenant@example.com"
                }
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                required
                autoComplete='email'
                className='bg-gray-50 border-gray-200 focus:bg-white transition-colors'
                icon={<div className='text-gray-400'>@</div>}
              />

              <div className='relative'>
                <Input
                  label='Password'
                  type={showPassword ? "text" : "password"}
                  placeholder='••••••••'
                  // hint={selectedRole === 'admin' ? 'Admin secret key' : undefined}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                  required
                  autoComplete='current-password'
                  className='bg-gray-50 border-gray-200 focus:bg-white transition-colors'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>

              <Button
                type='submit'
                className={`w-full h-12 text-base font-semibold shadow-lg shadow-indigo-500/20 ${
                  selectedRole === "admin"
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                }`}
                size='lg'
                isLoading={isLoading}
              >
                Sign In as {selectedRole === "tenant" ? "Tenant" : "Admin"}
              </Button>
            </form>

            <div className='mt-8 text-center'>
              {selectedRole === "tenant" ? (
                <p className='text-sm text-gray-500'>
                  New tenant?{" "}
                  <Link
                    href='/register'
                    className='text-indigo-600 hover:text-indigo-700 font-semibold hover:underline'
                  >
                    Create Account
                  </Link>
                </p>
              ) : (
                <p className='text-sm text-gray-500'>
                  Admin access is restricted.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className='text-center text-xs text-gray-400 mt-8 font-medium'>
          © {new Date().getFullYear()} {CONFIG.app.name}. Secure & Encrypted.
        </p>
      </div>
    </div>
  );
}
