import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { HomeAssistantProvider, useHomeAssistant } from './contexts/HomeAssistantContext';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { SidebarProvider } from './contexts/SidebarContext';
import { DashboardsProvider, useDashboards } from './contexts/DashboardsContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import './App.css';

const DashboardSync: React.FC = () => {
  const { dashboards, setActiveDashboardId } = useDashboards();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (dashboards.length === 0) return;

    const path = location.pathname;

    if (path === '/' && dashboards.length > 0) {
      // Redirect root to first dashboard
      const firstDashboard = dashboards[0];
      navigate(firstDashboard.path || '/');
      return;
    }

    const matchingDashboard = dashboards.find(d => d.path === path);
    if (matchingDashboard) {
      setActiveDashboardId(matchingDashboard.id);
    } else {
      // Path does not match any dashboard. Clear active selection to show 404 state.
      setActiveDashboardId(''); // or null if type allows, usually context handles empty string as "no selection"
    }
  }, [location.pathname, dashboards, setActiveDashboardId, navigate]);

  return null;
};

const AppContent: React.FC = () => {
  const { config } = useHomeAssistant();

  if (!config) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Configuration Missing</h2>
          <p className="mb-4 text-gray-300">
            Please configure the Home Assistant connection details using environment variables.
          </p>
          <div className="bg-gray-950 p-4 rounded text-left overflow-x-auto mb-4">
            <code className="text-sm text-green-400">
              HA_HOST=http://your-ha-instance:8123<br />
              HA_TOKEN=your_token
            </code>
          </div>
          <p className="text-sm text-gray-500">
            Check your <code className="bg-gray-700 px-1 rounded">.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
};

function App() {
  return (
    <BrowserRouter>
      <HomeAssistantProvider>
        <DashboardsProvider>
          <SidebarProvider>
            <DashboardSync />
            <Sidebar />
            <AppContent />
          </SidebarProvider>
        </DashboardsProvider>
      </HomeAssistantProvider>
    </BrowserRouter>
  );
}

export default App;
