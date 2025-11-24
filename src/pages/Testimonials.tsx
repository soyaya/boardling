import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

const Testimonials: React.FC = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      quote: "Boardling helped us identify a 40% drop-off in our onboarding flow. After fixing it, our retention improved by 25%.",
      author: "Sarah Chen",
      role: "CEO, ZecSwap",
      avatar: "SC",
      company: "ZecSwap",
      metric: "+25% retention"
    },
    {
      quote: "The shielded pool analytics are game-changing. We finally understand how our privacy features are being used.",
      author: "Marcus Rodriguez",
      role: "Product Lead, PrivacyDAO",
      avatar: "MR",
      company: "PrivacyDAO",
      metric: "2x privacy adoption"
    },
    {
      quote: "Real-time alerts on churn risk have saved us countless high-value users. ROI was immediate.",
      author: "Alex Kumar",
      role: "Growth, ZcashDeFi",
      avatar: "AK",
      company: "ZcashDeFi",
      metric: "-40% churn"
    },
    {
      quote: "The cohort analysis helped us segment our users effectively. We increased our conversion rate by 35%.",
      author: "Emma Wilson",
      role: "VP Product, ShieldPay",
      avatar: "EW",
      company: "ShieldPay",
      metric: "+35% conversion"
    },
    {
      quote: "Best analytics tool we've used. The productivity scores give us actionable insights every day.",
      author: "James Park",
      role: "CTO, ZecBridge",
      avatar: "JP",
      company: "ZecBridge",
      metric: "Daily insights"
    },
    {
      quote: "Boardling's API integration was seamless. We had it running in production within hours.",
      author: "Nina Patel",
      role: "Engineering Lead, PrivChain",
      avatar: "NP",
      company: "PrivChain",
      metric: "2hr integration"
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Loved by Zcash Builders</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          See how leading Zcash projects are using Boardling to understand their users and drive growth.
        </p>
        <div className="flex items-center justify-center space-x-8 text-gray-600">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">500+</div>
            <div className="text-sm">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <div className="text-sm mt-1">4.9/5 Rating</div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.author}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">{testimonial.metric}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Trusted by the Best</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600 mt-1">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">$50M+</div>
              <div className="text-sm text-gray-600 mt-1">Revenue Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">3M+</div>
              <div className="text-sm text-gray-600 mt-1">Wallets Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600 mt-1">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-black text-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Join hundreds of successful Zcash teams</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all"
          >
            <span className="mr-2">Start Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          © 2025 Boardling. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Testimonials;
