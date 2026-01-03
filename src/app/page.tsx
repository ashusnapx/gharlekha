import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { CONFIG } from "@/config/config";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#F8FAFC]'>
      {/* Navbar with Glassmorphism */}
      <nav className='fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'>
        <div className='container mx-auto px-6 h-20 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='relative h-10 w-10'>
              <Image
                src='/logo.png'
                alt='Logo'
                fill
                className='object-contain'
              />
            </div>
            <span className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600'>
              {CONFIG.app.name}
            </span>
          </div>
          <div className='hidden md:flex items-center gap-8'>
            <Link
              href='#features'
              className='text-gray-600 hover:text-indigo-600 font-medium transition-colors'
            >
              Features
            </Link>
            <Link
              href='#testimonials'
              className='text-gray-600 hover:text-indigo-600 font-medium transition-colors'
            >
              Testimonials
            </Link>
            <Link
              href='#pricing'
              className='text-gray-600 hover:text-indigo-600 font-medium transition-colors'
            >
              Pricing
            </Link>
          </div>
          <div className='flex items-center gap-4'>
            <Link
              href='/login'
              className='hidden md:block text-indigo-600 font-semibold hover:text-indigo-700'
            >
              Sign In
            </Link>
            <Link href='/register'>
              <Button className='bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg shadow-indigo-200'>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='pt-32 pb-20 relative overflow-hidden'>
        <div className='container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-8 z-10'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-sm'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-indigo-500'></span>
              </span>
              Trusted by 500+ Landlords
            </div>
            <h1 className='text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight'>
              Modernize Your <br />
              <span className='bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'>
                Rental Empire
              </span>
            </h1>
            <p className='text-xl text-gray-600 max-w-lg leading-relaxed'>
              Stop tracking rent in diaries. Automate bills, track expenses, and
              manage tenants with
              <span className='font-semibold text-gray-900'>
                {" "}
                banking-grade precision
              </span>
              .
            </p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link href='/register'>
                <Button className='h-14 px-8 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto'>
                  Start Free Trial
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
              </Link>
              <Link href='/demo'>
                <Button
                  variant='outline'
                  className='h-14 px-8 text-lg border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full w-full sm:w-auto'
                >
                  View Live Demo
                </Button>
              </Link>
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-500 pt-4'>
              <div className='flex -space-x-2'>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className='h-8 w-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative'
                  >
                    <Image
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                      alt='User'
                      fill
                    />
                  </div>
                ))}
              </div>
              <p>Join 2,000+ happy tenants managed</p>
            </div>
          </div>

          {/* Hero Image */}
          <div className='relative lg:h-[600px] w-full flex items-center justify-center perspective-1000'>
            {/* Abstract Background Blobs */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-200/30 via-purple-200/30 to-pink-200/30 rounded-full blur-3xl -z-10 animate-pulse-slow' />

            <div className='relative w-full h-full animate-float'>
              <Image
                src='/assets/landing/hero.png'
                alt='Ghar Lekha Dashboard'
                fill
                className='object-contain drop-shadow-2xl'
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-24 bg-white'>
        <div className='container mx-auto px-6'>
          <div className='text-center max-w-3xl mx-auto mb-20'>
            <h2 className='text-sm font-bold tracking-widest text-indigo-600 uppercase mb-3'>
              Everything You Need
            </h2>
            <h3 className='text-4xl font-bold text-gray-900 mb-6'>
              Superpowers for Landlords
            </h3>
            <p className='text-xl text-gray-500'>
              We&apos;ve automated the boring stuff so you can focus on growing
              your portfolio.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {/* Feature 1 */}
            <div className='group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 relative overflow-hidden'>
              <div className='h-48 w-full relative mb-8 group-hover:scale-105 transition-transform duration-500'>
                <Image
                  src='/assets/landing/feature-tenant.png'
                  alt='Tenant Management'
                  fill
                  className='object-contain'
                />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>
                {" "}
                Smart Profiles
              </h4>
              <p className='text-gray-600 leading-relaxed'>
                Store Aadhaar details, family info, and agreements securely.
                Bank-level encryption keeps data safe.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 relative overflow-hidden'>
              <div className='h-48 w-full relative mb-8 group-hover:scale-105 transition-transform duration-500'>
                <Image
                  src='/assets/landing/feature-bill.png'
                  alt='Billing Engine'
                  fill
                  className='object-contain'
                />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>
                Auto-Pilot Billing
              </h4>
              <p className='text-gray-600 leading-relaxed'>
                Generate professional PDF invoices with electricity units
                instantly calculated. Send via WhatsApp in one click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 relative overflow-hidden'>
              <div className='h-48 w-full relative mb-8 group-hover:scale-105 transition-transform duration-500'>
                <Image
                  src='/assets/landing/feature-stats.png'
                  alt='Analytics'
                  fill
                  className='object-contain'
                />
              </div>
              <h4 className='text-2xl font-bold text-gray-900 mb-3'>
                Financial Clarity
              </h4>
              <p className='text-gray-600 leading-relaxed'>
                Visualize cash flow, track pending dues, and monitor expenses
                with our beautiful real-time dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className='py-20 bg-gray-900 text-white'>
        <div className='container mx-auto px-6 text-center'>
          <h2 className='text-3xl font-bold mb-12'>
            Replacing Paper Diaries Across India
          </h2>
          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                text: "Finally organized my 12 flats. The billing feature is a life saver!",
                author: "Rajesh Kumar",
                role: "Property Owner, Delhi",
              },
              {
                text: "My tenants love the professional PDF bills. No more arguments about units.",
                author: "Priya Sharma",
                role: "Landlord, Bangalore",
              },
              {
                text: "The dashboard shows me exactly who hasn&apos;t paid. Outstanding app.",
                author: "Amit Patel",
                role: "Real Estate Investor, Mumbai",
              },
            ].map((t, i) => (
              <div
                key={i}
                className='p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm'
              >
                <div className='flex gap-1 text-yellow-500 mb-4 justify-center'>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className='h-4 w-4 fill-current' />
                  ))}
                </div>
                <p className='text-lg mb-6'>&quot;{t.text}&quot;</p>
                <div>
                  <div className='font-bold'>{t.author}</div>
                  <div className='text-sm text-gray-400'>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-100 py-12'>
        <div className='container mx-auto px-6 grid md:grid-cols-4 gap-8'>
          <div className='col-span-2'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='relative h-8 w-8'>
                <Image
                  src='/logo.png'
                  alt='Logo'
                  fill
                  className='object-contain'
                />
              </div>
              <span className='text-xl font-bold text-gray-900'>
                {CONFIG.app.name}
              </span>
            </div>
            <p className='text-gray-500 max-w-sm'>
              The smartest way to manage rental properties in India. Built with
              love for landlords who value their time.
            </p>
          </div>
          <div>
            <h4 className='font-bold text-gray-900 mb-4'>Product</h4>
            <ul className='space-y-2 text-gray-600'>
              <li>
                <Link href='#'>Features</Link>
              </li>
              <li>
                <Link href='#'>Pricing</Link>
              </li>
              <li>
                <Link href='#'>Security</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className='font-bold text-gray-900 mb-4'>Legal</h4>
            <ul className='space-y-2 text-gray-600'>
              <li>
                <Link href='#'>Privacy Policy</Link>
              </li>
              <li>
                <Link href='#'>Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='container mx-auto px-6 pt-8 mt-8 border-t border-gray-100 text-center text-gray-400 text-sm'>
          © {new Date().getFullYear()} {CONFIG.app.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
