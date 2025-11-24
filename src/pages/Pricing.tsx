import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Start free, scale as you grow. No hidden fees, no surprises.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
            <p className="text-gray-600 mb-6">Perfect for early-stage projects</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Up to 1,000 wallets',
                'Basic analytics dashboard',
                '7-day data retention',
                'Email support',
                'Community access',
                'Basic API access'
              ].map((feature) => (
                <li key={feature} className="flex items-start text-gray-700">
                  <Check className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-900 hover:text-white transition-colors"
            >
              Start Free
            </button>
          </div>

          {/* Pro */}
          <div className="p-8 border-2 border-black rounded-2xl relative bg-black text-white hover:shadow-2xl transition-shadow">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-gray-300 mb-6">For growing Zcash projects</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$99</span>
              <span className="text-gray-300">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Up to 50,000 wallets',
                'Advanced analytics suite',
                'Unlimited data retention',
                'Priority email & chat support',
                'Custom alerts & notifications',
                'Shielded pool analytics',
                'Cohort & retention analysis',
                'API with higher rate limits'
              ].map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="w-5 h-5 mr-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Start 14-Day Trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <p className="text-gray-600 mb-6">For large-scale deployments</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">Custom</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Unlimited wallets',
                'White-label solution',
                'Dedicated account manager',
                '99.9% SLA guarantee',
                'Custom integrations',
                'On-premise deployment option',
                'Advanced security features',
                'Custom contract terms'
              ].map((feature) => (
                <li key={feature} className="flex items-start text-gray-700">
                  <Check className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => window.open('mailto:sales@boardling.io', '_blank')}
              className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-900 hover:text-white transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              question: 'Can I switch plans at any time?',
              answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the charges.'
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and cryptocurrency payments.'
            },
            {
              question: 'Is there a long-term contract?',
              answer: 'No. All plans are month-to-month with no long-term commitment. Cancel anytime.'
            },
            {
              question: 'What happens if I exceed my wallet limit?',
              answer: 'We\'ll notify you when you approach your limit. You can upgrade your plan or we\'ll help you optimize your usage.'
            },
            {
              question: 'Do you offer discounts for annual billing?',
              answer: 'Yes! Save 20% with annual billing. Contact us for details.'
            },
          ].map((faq, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-black text-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
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

export default Pricing;
