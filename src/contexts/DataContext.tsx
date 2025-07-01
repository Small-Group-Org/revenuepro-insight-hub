
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Targets {
  leads: number;
  appointmentsSet: number;
  appointmentsComplete: number;
  jobsBooked: number;
  salesRevenue: number;
  metaBudgetSpent: number;
}

interface ActualData {
  week: string;
  leads: number;
  appointmentsSet: number;
  appointmentsComplete: number;
  jobsBooked: number;
  salesRevenue: number;
  metaBudgetSpent: number;
  notes?: string;
}

interface DataContextType {
  targets: Targets;
  actualData: ActualData[];
  updateTargets: (newTargets: Targets) => void;
  addActualData: (data: ActualData) => void;
  updateActualData: (weekId: string, data: ActualData) => void;
  resetTargets: () => void;
}

const defaultTargets: Targets = {
  leads: 100,
  appointmentsSet: 50,
  appointmentsComplete: 40,
  jobsBooked: 20,
  salesRevenue: 25000,
  metaBudgetSpent: 5000,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [targets, setTargets] = useState<Targets>(defaultTargets);
  const [actualData, setActualData] = useState<ActualData[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTargets = localStorage.getItem('revenuepro-targets');
    const savedActuals = localStorage.getItem('revenuepro-actuals');
    
    if (savedTargets) {
      setTargets(JSON.parse(savedTargets));
    }
    
    if (savedActuals) {
      setActualData(JSON.parse(savedActuals));
    }
  }, []);

  // Save targets to localStorage
  const updateTargets = (newTargets: Targets) => {
    setTargets(newTargets);
    localStorage.setItem('revenuepro-targets', JSON.stringify(newTargets));
  };

  // Add new actual data
  const addActualData = (data: ActualData) => {
    const updatedData = [...actualData];
    const existingIndex = updatedData.findIndex(item => item.week === data.week);
    
    if (existingIndex >= 0) {
      updatedData[existingIndex] = data;
    } else {
      updatedData.push(data);
    }
    
    setActualData(updatedData);
    localStorage.setItem('revenuepro-actuals', JSON.stringify(updatedData));
  };

  // Update existing actual data
  const updateActualData = (weekId: string, data: ActualData) => {
    const updatedData = actualData.map(item => 
      item.week === weekId ? data : item
    );
    setActualData(updatedData);
    localStorage.setItem('revenuepro-actuals', JSON.stringify(updatedData));
  };

  // Reset targets to defaults
  const resetTargets = () => {
    setTargets(defaultTargets);
    localStorage.setItem('revenuepro-targets', JSON.stringify(defaultTargets));
  };

  return (
    <DataContext.Provider value={{
      targets,
      actualData,
      updateTargets,
      addActualData,
      updateActualData,
      resetTargets,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
