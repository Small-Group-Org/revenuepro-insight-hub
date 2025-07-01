
import React, { useState } from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { SetTargets } from '@/components/SetTargets';
import { AddActualData } from '@/components/AddActualData';
import { CompareResults } from '@/components/CompareResults';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'targets':
        return <SetTargets />;
      case 'actuals':
        return <AddActualData />;
      case 'compare':
        return <CompareResults />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-auto">
          {renderActiveSection()}
        </main>
      </div>
    </DataProvider>
  );
};

export default Index;
