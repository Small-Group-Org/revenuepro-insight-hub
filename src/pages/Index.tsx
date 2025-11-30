import { useState } from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/dashboard/Dashboard';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
  };

  return (
    <DataProvider>
      <div className="min-h-screen flex bg-background">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </DataProvider>
  );
};

export default Index;
