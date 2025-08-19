import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useState } from "react";

// Import components
import { Dashboard } from "@/components/Dashboard";
import { SetTargets } from "@/pages/SetTargets";
import { AddActualData } from "@/pages/AddActualData";
import { LeadSheet } from "@/pages/LeadSheet";
import { LeadAnalytics } from "@/pages/LeadAnalytics";
import NotFound from "@/pages/NotFound";
import Login from "./pages/Login";
import { UserProvider } from "./utils/UserContext";
import { CompareResults } from "@/pages/CompareResults";
import CreateUser from "./pages/CreateUser";
import UserSelect from "@/components/UserSelect";
import { DataProvider } from "@/contexts/DataContext";

const App = () => {
  // Create a QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserProvider>
            <DataProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/targets" element={<SetTargets />} />
                  <Route path="/actuals" element={<AddActualData />} />
                  <Route path="/compare" element={<CompareResults />} />
                  <Route path="/leads" element={<LeadSheet />} />
                  <Route path="/lead-analytics" element={<LeadAnalytics />} />
                  <Route path="/create-user" element={<CreateUser />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DataProvider>
          </UserProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
