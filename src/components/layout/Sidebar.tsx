import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Users,
  GitMerge,
  Shield,
  Bell,
  Settings,
  PieChart,
  ArrowRightLeft
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: GitMerge, label: 'Adoption Funnel', path: '/adoption' },
    { icon: Users, label: 'Retention', path: '/retention' },
    { icon: ArrowRightLeft, label: 'Comparison', path: '/comparison' },
    { icon: PieChart, label: 'Productivity', path: '/productivity' },
    { icon: Shield, label: 'Shielded Pool', path: '/shielded' },
    { icon: Users, label: 'Segments', path: '/segments' },
    { icon: LayoutDashboard, label: 'Project Health', path: '/project-health' },
  ];

  const secondaryItems = [
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Boardling" className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Boardling</span>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-6 overflow-y-auto py-4">
        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Overview
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? 'bg-gray-50 text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            System
          </p>
          <nav className="space-y-1">
            {secondaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? 'bg-gray-50 text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0"></div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">Zcash DeFi</p>
            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
