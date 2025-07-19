
import React, { useState } from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { SetTargets } from '@/pages/SetTargets';
import { AddActualData } from '@/pages/AddActualData';
import { CompareResults } from '@/pages/CompareResults';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
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
