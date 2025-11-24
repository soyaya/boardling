import React, { useState } from 'react';
import { Shield, Bell, Key, CreditCard, User, Save } from 'lucide-react';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'api' | 'billing';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('privacy');
  const [privateMode, setPrivateMode] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [monetizableData, setMonetizableData] = useState(false);

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-black' : 'bg-gray-200'
        }`}
    >
      <span
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage your account, privacy, and preferences</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { icon: User, label: 'Profile', tab: 'profile' as SettingsTab },
              { icon: Shield, label: 'Privacy & Wallets', tab: 'privacy' as SettingsTab },
              { icon: Bell, label: 'Notifications', tab: 'notifications' as SettingsTab },
              { icon: Key, label: 'API Keys', tab: 'api' as SettingsTab },
              { icon: CreditCard, label: 'Billing', tab: 'billing' as SettingsTab },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === item.tab
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'privacy' && (
            <>
              {/* Wallet Privacy Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Wallet Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Private Mode</p>
                      <p className="text-sm text-gray-500">Your wallet data is encrypted and never shared.</p>
                    </div>
                    <ToggleSwitch enabled={privateMode} onChange={() => setPrivateMode(!privateMode)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Public Profile</p>
                      <p className="text-sm text-gray-500">Allow others to see your aggregated stats (no specific txs).</p>
                    </div>
                    <ToggleSwitch enabled={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50 border-green-100">
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900 mr-2">Monetizable Data</p>
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-bold">Beta</span>
                      </div>
                      <p className="text-sm text-gray-500">Earn tokens by sharing anonymized behavioral patterns.</p>
                    </div>
                    <ToggleSwitch enabled={monetizableData} onChange={() => setMonetizableData(!monetizableData)} />
                  </div>
                </div>
              </div>

              {/* API Keys Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">API Keys</h3>
                  <button className="text-sm text-blue-600 font-medium hover:underline">Generate New Key</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <Key className="w-4 h-4 text-gray-400 mr-3" />
                      <code className="text-sm font-mono text-gray-600">pk_live_...8923</code>
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'notifications' || activeTab === 'api' || activeTab === 'billing') && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {activeTab === 'notifications' && 'Notification Preferences'}
                {activeTab === 'api' && 'API Configuration'}
                {activeTab === 'billing' && 'Billing & Subscription'}
              </h3>
              <p className="text-gray-500">This section is coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
