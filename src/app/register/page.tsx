"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  Building2,
  User,
} from "lucide-react";

import { Button, Input, Card, CardContent, useToast } from "@/components/ui";
import { CONFIG } from "@/config/config";
import { registerSchema } from "@/lib/validators";
import { registerUser } from "@/app/actions/register";

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"tenant" | "admin">("tenant");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
    landlord_code: "", // Only for tenants
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (role === "tenant" && !formData.landlord_code) {
      setErrors({
        landlord_code: "Landlord Code is required to join a property.",
      });
      return;
    }

    // Prepare data for validation
    let dataToValidate = { ...formData };
    if (role === "admin" || !dataToValidate.landlord_code) {
      // Remove landlord_code if admin
      const { landlord_code, ...rest } = dataToValidate;
      dataToValidate = rest as any;
    }

    const result = registerSchema.safeParse(dataToValidate);
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
      const result = await registerUser({
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        password: formData.password,
        role: role,
        landlord_code: role === "tenant" ? formData.landlord_code : undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      addToast({
        type: "success",
        title: "Welcome to Ghar Lekha!",
        message: "Account Created! You can now sign in.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      addToast({
        type: "error",
        title: "Registration Failed",
        message: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative flex items-center justify-center p-4 bg-gray-50 overflow-hidden'>
      {/* Decorative Vector Background - Matching Login Page */}
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
        <div className='absolute top-20 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'></div>
        <div className='absolute bottom-20 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'></div>
      </div>

      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30'>
            <UserPlus className='h-8 w-8' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>
            Join {CONFIG.app.name}
          </h1>
          <p className='text-gray-500 mt-2 font-medium'>Create your account</p>
        </div>

        <Card
          variant='elevated'
          className='border-0 shadow-2xl shadow-indigo-100'
        >
          <CardContent className='py-8 px-8'>
            {/* Role Selector */}
            <div className='mb-6'>
              <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block'>
                I am a
              </label>
              <div className='grid grid-cols-2 gap-3 p-1 bg-gray-100/80 rounded-xl'>
                <button
                  type='button'
                  onClick={() => setRole("tenant")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === "tenant"
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User className='h-4 w-4' />
                  Tenant
                </button>
                <button
                  type='button'
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === "admin"
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Building2 className='h-4 w-4' />
                  Landlord
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <Input
                label='Full Name'
                placeholder='John Doe'
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                error={errors.full_name}
                required
                className='bg-gray-50 border-gray-200 focus:bg-white'
              />

              <Input
                label='Mobile Number'
                placeholder='9876543210'
                maxLength={10}
                value={formData.mobile_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile_number: e.target.value.replace(/\D/g, ""),
                  })
                }
                error={errors.mobile_number}
                required
                className='bg-gray-50 border-gray-200 focus:bg-white'
              />

              <Input
                label='Email Address'
                type='email'
                placeholder='you@example.com'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                required
                className='bg-gray-50 border-gray-200 focus:bg-white'
              />

              {role === "tenant" && (
                <div className='animate-in fade-in slide-in-from-top-2 duration-300'>
                  <Input
                    label='Landlord Code'
                    placeholder='Enter 6-char code from Landlord'
                    value={formData.landlord_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        landlord_code: e.target.value.toUpperCase(),
                      })
                    }
                    error={errors.landlord_code}
                    required
                    maxLength={6}
                    className='bg-indigo-50 border-indigo-200 focus:bg-white focus:border-indigo-400 text-indigo-900 placeholder:text-indigo-300 font-mono tracking-wider'
                    hint='Ask your landlord for their unique code'
                  />
                </div>
              )}

              <div className='relative'>
                <Input
                  label='Password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                  hint={`Min ${CONFIG.auth.passwordMinLength} chars`}
                  required
                  className='bg-gray-50 border-gray-200 focus:bg-white'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
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
                className='w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20'
                size='lg'
                isLoading={isLoading}
              >
                Join as {role === "tenant" ? "Tenant" : "Landlord"}{" "}
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-gray-500'>
                Already have an account?{" "}
                <Link
                  href='/login'
                  className='text-indigo-600 hover:text-indigo-700 font-semibold hover:underline'
                >
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
