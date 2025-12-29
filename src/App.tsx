import React from 'react';
import { HomeAssistantProvider, useHomeAssistant } from './contexts/HomeAssistantContext';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { SidebarProvider } from './contexts/SidebarContext';
import { DashboardsProvider } from './contexts/DashboardsContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import './App.css';

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
    <HomeAssistantProvider>
      <DashboardsProvider>
        <SidebarProvider>
          <Sidebar />
          <AppContent />
        </SidebarProvider>
      </DashboardsProvider>
    </HomeAssistantProvider>
  );
}

export default App;
