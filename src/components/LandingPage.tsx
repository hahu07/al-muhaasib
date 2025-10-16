'use client';

import React, { useState } from 'react';
import {
  BookOpenIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  DollarSignIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MenuIcon,
  XIcon,
  StarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">₦</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Al-Muhaasib</h1>
              <p className="text-xs text-gray-500">School Accounting System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <Button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700">
              Get Started
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Features</a>
              <a href="#benefits" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Benefits</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Pricing</a>
              <div className="pt-2">
                <Button onClick={onGetStarted} className="w-full bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Modern School
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Accounting{' '}
              </span>
              Made Simple
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600">
              Al-Muhaasib is a comprehensive school financial management system designed for Nigerian schools. 
              Manage student fees, track payments, generate reports, and maintain financial records with ease.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button 
                onClick={onGetStarted} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                Free 30-day trial
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                Nigerian Naira support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage school finances
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built specifically for Nigerian schools with local requirements in mind
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<DollarSignIcon className="h-8 w-8" />}
              title="Fee Management"
              description="Set up fee structures, track payments, and manage outstanding balances with automated reminders."
            />
            <FeatureCard
              icon={<UsersIcon className="h-8 w-8" />}
              title="Student Records"
              description="Maintain comprehensive student profiles with payment history, guardians info, and academic details."
            />
            <FeatureCard
              icon={<BarChart3Icon className="h-8 w-8" />}
              title="Financial Reports"
              description="Generate detailed financial reports, analytics, and insights to track school performance."
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="h-8 w-8" />}
              title="Secure & Reliable"
              description="Built on blockchain technology with enterprise-grade security and data protection."
            />
            <FeatureCard
              icon={<BookOpenIcon className="h-8 w-8" />}
              title="Multi-User Access"
              description="Role-based access control for administrators, accounting staff, and other stakeholders."
            />
            <FeatureCard
              icon={<CheckCircleIcon className="h-8 w-8" />}
              title="Mobile Ready"
              description="Fully responsive design that works perfectly on all devices - desktop, tablet, and mobile."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-gray-50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why schools choose Al-Muhaasib
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Join hundreds of Nigerian schools that trust Al-Muhaasib for their financial management needs.
              </p>
              <div className="mt-8 space-y-6">
                <BenefitItem
                  title="Save Time & Reduce Errors"
                  description="Automate fee calculations, payment tracking, and report generation to eliminate manual errors."
                />
                <BenefitItem
                  title="Improve Cash Flow"
                  description="Real-time payment tracking and automated reminders help improve fee collection rates."
                />
                <BenefitItem
                  title="Nigerian Naira Native"
                  description="Built specifically for Nigerian schools with proper Naira formatting and local banking integration."
                />
                <BenefitItem
                  title="Transparent & Accountable"
                  description="Blockchain-based system ensures all financial records are transparent and auditable."
                />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="h-full flex flex-col justify-center items-center text-center">
                  <div className="text-4xl font-bold mb-2">₦2.5M+</div>
                  <div className="text-lg opacity-90 mb-6">Processed Monthly</div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-xl font-semibold">98%</div>
                      <div className="text-sm opacity-75">Accuracy</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-xl font-semibold">150+</div>
                      <div className="text-sm opacity-75">Schools</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by schools across Nigeria
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="Al-Muhaasib has transformed our fee collection process. We've seen a 40% improvement in payment rates."
              author="Mrs. Adebayo"
              position="Principal, Rainbow Schools Lagos"
            />
            <TestimonialCard
              quote="The mobile-friendly interface means our accounting staff can work from anywhere. It's been a game-changer."
              author="Mr. Ibrahim"
              position="Bursar, Federal College Kaduna"
            />
            <TestimonialCard
              quote="Finally, a system that understands Nigerian schools. The Naira formatting and local banking integration is perfect."
              author="Miss Okafor"
              position="Finance Officer, St. Mary's Abuja"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to modernize your school&apos;s financial management?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
            Join thousands of Nigerian schools using Al-Muhaasib to streamline their accounting processes.
          </p>
          <div className="mt-10">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-3"
            >
              Start Your Free Trial Today
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">₦</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Al-Muhaasib</h3>
                <p className="text-gray-400 text-sm">School Accounting System</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 Al-Muhaasib. Built for Nigerian Schools.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ title, description }: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <CheckCircleIcon className="h-6 w-6 text-green-500" />
      </div>
      <div className="ml-4">
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, position }: {
  quote: string;
  author: string;
  position: string;
}) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <blockquote className="text-gray-700 mb-6 leading-relaxed">
&ldquo;{quote}&rdquo;
      </blockquote>
      <div>
        <div className="font-semibold text-gray-900">{author}</div>
        <div className="text-sm text-gray-500">{position}</div>
      </div>
    </div>
  );
}