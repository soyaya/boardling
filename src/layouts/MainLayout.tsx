import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { useProjectActions, useProjects } from '../store/useProjectStore';

const MainLayout: React.FC = () => {
  const { fetchProjects, setCurrentProject } = useProjectActions();
  const { projects, loading } = useProjects();

  // Fetch projects when layout mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Set first project as current if none is selected
  useEffect(() => {
    if (!loading && projects.length > 0) {
      // Check if there's a current project in the store
      const { currentProject } = useProjectStore.getState();
      
      if (!currentProject) {
        // Set the first project as current
        setCurrentProject(projects[0]);
        console.log('Auto-selected first project:', projects[0].name);
      }
    }
  }, [projects, loading, setCurrentProject]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Import the store to access state
import { useProjectStore } from '../store/useProjectStore';

export default MainLayout;
