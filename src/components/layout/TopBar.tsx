import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, LogOut, Settings, User } from 'lucide-react';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-colors"
            placeholder="Type a command or search..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-4">
        {/* Help Button */}
        <button
          onClick={() => window.open('https://docs.boardling.io', '_blank')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {[
                  { title: 'Retention dropped 5%', time: '2h ago', type: 'warning' },
                  { title: 'New high-value wallet', time: '4h ago', type: 'success' },
                  { title: 'Weekly report ready', time: '1d ago', type: 'info' },
                ].map((notif, i) => (
                  <button
                    key={i}
                    onClick={() => navigate('/notifications')}
                    className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-xs text-black font-medium hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        {/* Profile Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2"
            title="Profile Menu"
          >
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
              JD
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <div className="border-t border-gray-100 my-2"></div>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
