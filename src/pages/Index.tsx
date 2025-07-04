
import React, { useState } from 'react';
import { EnhancedDataProvider } from '@/contexts/EnhancedDataContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { EnhancedSetTargets } from '@/components/EnhancedSetTargets';
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
        return <EnhancedSetTargets />;
      case 'actuals':
        return <AddActualData />;
      case 'compare':
        return <CompareResults />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <EnhancedDataProvider>
      <div className="min-h-screen flex bg-background">
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
    </EnhancedDataProvider>
  );
};

export default Index;
