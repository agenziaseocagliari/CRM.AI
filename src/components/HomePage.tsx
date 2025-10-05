import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap, Users, BarChart3, Sparkles, Shield, Globe, Clock } from 'lucide-react';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Helmet>
        <title>CRM AI - Intelligent Customer Relationship Management | Boost Your Sales</title>
        <meta name="description" content="Transform your business with CRM AI - the intelligent customer relationship management platform. Automate workflows, boost sales by 40%, and deliver exceptional customer experiences with AI-powered insights." />
        <meta name="keywords" content="CRM, AI, customer relationship management, sales automation, lead generation, business intelligence, customer analytics" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        <meta property="og:title" content="CRM AI - Intelligent Customer Relationship Management" />
        <meta property="og:description" content="Transform your business with AI-powered CRM. Automate workflows, boost sales, and deliver exceptional customer experiences." />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        <meta property="twitter:title" content="CRM AI - Intelligent Customer Relationship Management" />
        <meta property="twitter:description" content="Transform your business with AI-powered CRM. Automate workflows, boost sales, and deliver exceptional customer experiences." />
        
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3B82F6" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 ring-1 ring-blue-600/20">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered CRM Platform
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Business </span>
              with Intelligent CRM
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Automate workflows, boost sales by 40%, and deliver exceptional customer experiences 
              with our AI-powered customer relationship management platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                Watch Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                Global Scale
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-purple-500" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage customer relationships, automate sales processes, 
              and grow your business intelligently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-300 border border-blue-200/50">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Automation</h3>
              <p className="text-gray-600">
                Automate repetitive tasks, lead scoring, and follow-ups with advanced AI algorithms 
                that learn from your business patterns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 border border-purple-200/50">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">360° Customer View</h3>
              <p className="text-gray-600">
                Get complete customer insights with unified profiles, interaction history, 
                and predictive analytics for better decision making.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 transition-all duration-300 border border-green-200/50">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
              <p className="text-gray-600">
                Track performance metrics, forecast sales, and identify opportunities 
                with real-time dashboards and intelligent reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of companies that have transformed their customer relationships with our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">10k+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">40%</div>
              <div className="text-blue-100">Sales Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Start your free trial today and see how our AI-powered CRM can help you 
            boost sales, improve customer relationships, and grow your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
              Contact Sales
            </button>
          </div>

          {/* Additional trust elements */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
};
