import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Zap, Users, TrendingUp, Activity, Check, Star, Eye, Lock, Gauge } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-900 mb-6">
            <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
            Trusted by 500+ Zcash projects
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Understand Your Users.<br />Grow Your Zcash Product.
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The most comprehensive analytics platform for Zcash-based Web3 startups. Track wallet behavior, retention, and productivity with privacy-first insights.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/signup')}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-all"
            >
              <span className="mr-2">Start Free Trial</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-full hover:border-gray-900 transition-all"
            >
              Sign In
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-gray-900">500+</div>
            <div className="text-sm text-gray-600 mt-1">Active Projects</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">2.4M</div>
            <div className="text-sm text-gray-600 mt-1">Wallets Tracked</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">99.9%</div>
            <div className="text-sm text-gray-600 mt-1">Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">$12M+</div>
            <div className="text-sm text-gray-600 mt-1">Revenue Tracked</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 bg-gray-50 rounded-3xl my-12">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Everything You Need to Understand Your Users
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Powerful analytics tools designed specifically for Zcash and privacy-focused blockchain products
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: 'Behavior Analytics',
              description: 'Track wallet behavior flow, transaction patterns, and user journeys with Sankey diagrams and detailed insights.'
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: 'Retention & Cohorts',
              description: 'Analyze cohort retention, identify churn risks, and track recurring transaction patterns over time.'
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: 'Adoption Funnel',
              description: 'Visualize conversion from wallet creation to high-value engagement with actionable drop-off insights.'
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: 'Shielded Pool Analytics',
              description: 'Deep dive into privacy-preserving transactions with shielded vs transparent usage analysis.'
            },
            {
              icon: <Activity className="w-6 h-6" />,
              title: 'Productivity Score',
              description: 'Comprehensive wallet efficiency metrics with color-coded indicators across 6 key dimensions.'
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'Real-time Alerts',
              description: 'Get notified of retention drops, adoption changes, and churn risks with AI-powered recommendations.'
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black bg-opacity-5 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Built for Every Stage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Early Stage</h3>
            <p className="text-gray-600 text-sm">
              Understand your first users, identify product-market fit, and optimize onboarding flows.
            </p>
          </div>
          <div className="text-center p-8 border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gauge className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Growth Stage</h3>
            <p className="text-gray-600 text-sm">
              Scale retention strategies, reduce churn, and increase user lifetime value with data-driven insights.
            </p>
          </div>
          <div className="text-center p-8 border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise</h3>
            <p className="text-gray-600 text-sm">
              Custom integrations, dedicated support, and advanced privacy features for large-scale deployments.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20 bg-gray-50 rounded-3xl my-12">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Loved by Zcash Builders</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Boardling helped us identify a 40% drop-off in our onboarding flow. After fixing it, our retention improved by 25%.",
              author: "Sarah Chen",
              role: "CEO, ZecSwap",
              avatar: "SC"
            },
            {
              quote: "The shielded pool analytics are game-changing. We finally understand how our privacy features are being used.",
              author: "Marcus Rodriguez",
              role: "Product Lead, PrivacyDAO",
              avatar: "MR"
            },
            {
              quote: "Real-time alerts on churn risk have saved us countless high-value users. ROI was immediate.",
              author: "Alex Kumar",
              role: "Growth, ZcashDeFi",
              avatar: "AK"
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Simple, Transparent Pricing</h2>
        <p className="text-center text-gray-600 mb-12">Start free, scale as you grow</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 border-2 border-gray-200 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {['Up to 1K wallets', 'Basic analytics', '7-day data retention', 'Email support'].map((feature) => (
                <li key={feature} className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-900 transition-colors"
            >
              Start Free
            </button>
          </div>

          <div className="p-8 border-2 border-black rounded-2xl relative bg-black text-white">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-gray-300">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {['Up to 50K wallets', 'Advanced analytics', 'Unlimited retention', 'Priority support', 'Custom alerts'].map((feature) => (
                <li key={feature} className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Start Trial
            </button>
          </div>

          <div className="p-8 border-2 border-gray-200 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <ul className="space-y-3 mb-6">
              {['Unlimited wallets', 'White-label', 'Dedicated support', 'SLA guarantee', 'Custom integrations'].map((feature) => (
                <li key={feature} className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => window.open('mailto:sales@boardling.io', '_blank')}
              className="w-full py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-900 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-black text-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to grow your Zcash product?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join leading Zcash startups using Boardling to understand their users and drive growth.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all"
          >
            <span className="mr-2">Start Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-gray-400">14-day free trial • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900">API Reference</a></li>
                <li><a href="#" className="hover:text-gray-900">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2025 Boardling. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
