import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRightLeft,
  ChevronDown,
  Check,
  FolderKanban
} from 'lucide-react';
import { useProjects, useCurrentProject, useProjectActions } from '../../store/useProjectStore';

const Sidebar: React.FC = () => {
  const { projects, loading } = useProjects();
  const { currentProject } = useCurrentProject();
  const { setCurrentProject } = useProjectActions();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
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

  // Close project menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (project: any) => {
    setCurrentProject(project);
    setShowProjectMenu(false);
    console.log('Selected project:', project.name);
  };

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
        <div className="relative" ref={projectMenuRef}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            disabled={loading || projects.length === 0}
          >
            <div className="flex items-center overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0"></div>
              <div className="ml-3 overflow-hidden flex-1">
                {loading ? (
                  <p className="text-sm font-medium text-gray-500">Loading...</p>
                ) : currentProject ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 truncate">{currentProject.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{currentProject.category}</p>
                  </>
                ) : projects.length > 0 ? (
                  <p className="text-sm font-medium text-gray-500">Select Project</p>
                ) : (
                  <p className="text-sm font-medium text-gray-500">No Projects</p>
                )}
              </div>
            </div>
            {projects.length > 0 && (
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showProjectMenu ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Project Selector Dropdown */}
          {showProjectMenu && projects.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 max-h-64 overflow-y-auto z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">Select Project</p>
              </div>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center overflow-hidden flex-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex-shrink-0"></div>
                    <div className="ml-2 overflow-hidden flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-500 truncate capitalize">{project.category}</p>
                    </div>
                  </div>
                  {currentProject?.id === project.id && (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2 px-3">
                <NavLink
                  to="/projects"
                  onClick={() => setShowProjectMenu(false)}
                  className="w-full px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <FolderKanban className="w-4 h-4" />
                  Manage Projects
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
