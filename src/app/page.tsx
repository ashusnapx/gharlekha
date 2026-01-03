import Link from "next/link";
import { Home, ArrowRight, Users, Gauge, FileText, Shield } from "lucide-react";
import { CONFIG } from "@/config/config";

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50'>
      {/* Header */}
      <header className='container mx-auto px-4 py-6'>
        <nav className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center'>
              <Home className='h-5 w-5 text-white' />
            </div>
            <span className='text-xl font-bold text-gray-900'>
              {CONFIG.app.name}
            </span>
          </div>
          <Link
            href='/login'
            className='px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors'
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className='container mx-auto px-4 py-16 lg:py-24'>
        <div className='text-center max-w-3xl mx-auto'>
          <h1 className='text-4xl lg:text-5xl font-bold text-gray-900 mb-6'>
            {CONFIG.app.tagline}
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            Digitize your rental management. Track tenants, meter readings,
            generate bills, and manage expenses — all in one place. No more
            paper diaries.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/login'
              className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors'
            >
              Get Started
              <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              href='/register'
              className='inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors'
            >
              Register as Tenant
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
            <div className='h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4'>
              <Users className='h-6 w-6 text-indigo-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Tenant Management
            </h3>
            <p className='text-gray-600 text-sm'>
              Complete tenant profiles with occupancy details, Aadhaar
              verification, and more.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
            <div className='h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4'>
              <Gauge className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Meter Readings
            </h3>
            <p className='text-gray-600 text-sm'>
              Monthly electricity tracking with automatic unit calculation and
              history.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
            <div className='h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4'>
              <FileText className='h-6 w-6 text-purple-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Bill Generation
            </h3>
            <p className='text-gray-600 text-sm'>
              One-click professional PDF bills with rent, electricity, and water
              charges.
            </p>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
            <div className='h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4'>
              <Shield className='h-6 w-6 text-orange-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Secure & Private
            </h3>
            <p className='text-gray-600 text-sm'>
              Encrypted Aadhaar storage, role-based access, and complete data
              isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='container mx-auto px-4 py-8 text-center text-sm text-gray-500'>
        <p>
          © {new Date().getFullYear()} {CONFIG.app.name}. Built for Indian
          landlords.
        </p>
      </footer>
    </div>
  );
}
