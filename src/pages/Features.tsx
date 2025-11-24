import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Shield, Zap, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

const Features: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Powerful Analytics for Zcash Products</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Everything you need to understand your users, optimize retention, and grow your Zcash-based product.
        </p>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[
            {
              icon: <BarChart3 className="w-8 h-8" />,
              title: 'Behavior Analytics',
              description: 'Track wallet behavior flow, transaction patterns, and user journeys with Sankey diagrams and detailed insights.',
              features: [
                'Sankey flow diagrams',
                'Transaction pattern analysis',
                'User journey mapping',
                'Feature usage tracking'
              ]
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: 'Retention & Cohorts',
              description: 'Analyze cohort retention, identify churn risks, and track recurring transaction patterns over time.',
              features: [
                'Cohort retention heatmaps',
                'Churn risk identification',
                'Recurring transaction analysis',
                'Week-over-week comparisons'
              ]
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: 'Adoption Funnel',
              description: 'Visualize conversion from wallet creation to high-value engagement with actionable drop-off insights.',
              features: [
                '6-stage funnel visualization',
                'Drop-off analysis',
                'Conversion optimization',
                'Time-to-value metrics'
              ]
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: 'Shielded Pool Analytics',
              description: 'Deep dive into privacy-preserving transactions with shielded vs transparent usage analysis.',
              features: [
                'Privacy usage trends',
                'Shielded vs transparent ratio',
                'Anonymity set tracking',
                'Pool velocity metrics'
              ]
            },
            {
              icon: <Activity className="w-8 h-8" />,
              title: 'Productivity Score',
              description: 'Comprehensive wallet efficiency metrics with color-coded indicators across 6 key dimensions.',
              features: [
                'Transaction frequency score',
                'Engagement consistency',
                'Feature adoption rate',
                'Color-coded health indicators'
              ]
            },
            {
              icon: <Zap className="w-8 h-8" />,
              title: 'Real-time Alerts',
              description: 'Get notified of retention drops, adoption changes, and churn risks with AI-powered recommendations.',
              features: [
                'Custom alert triggers',
                'AI-powered insights',
                'Email & in-app notifications',
                'Actionable recommendations'
              ]
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-black bg-opacity-5 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.features.map((item, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
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

export default Features;
