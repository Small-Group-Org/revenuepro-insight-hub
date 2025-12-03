import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useUserContext } from "@/utils/UserContext";

// Import components
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { SetTargets } from "@/pages/SetTargets";
import { AddActualData } from "@/pages/weekly-reporting/WeeklyReporting";
import { LeadSheet } from "@/pages/LeadSheet";
import { LeadAnalytics } from "@/pages/LeadAnalytics";
import NotFound from "@/pages/NotFound";
import Login from "./pages/Login";
import { UserProvider } from "./utils/UserContext";
import { CompareResults } from "@/pages/CompareResults";
import CreateUser from "./pages/CreateUser";
import { DataProvider } from "@/contexts/DataContext";
import Profile from "@/pages/profile/Profile";
import ReleaseNotes from "@/pages/ReleaseNotes";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";

const AppRoutes = () => {
  const { isVerifying } = useUserContext();

  return (
    <>
      <FullScreenLoader isLoading={isVerifying} message="Verifying authentication..." />
      <OAuthCallbackHandler />
      <DataProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/release-notes" element={<ReleaseNotes />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/global-dashboard" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/targets" element={<SetTargets />} />
            <Route path="/actuals" element={<AddActualData />} />
            <Route path="/compare" element={<CompareResults />} />
            <Route path="/leads" element={<LeadSheet />} />
            <Route path="/lead-analytics" element={<LeadAnalytics />} />
            <Route path="/user-management" element={<CreateUser />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DataProvider>
    </>
  );
};

const App = () => {
  // Create a QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <UserProvider>
              <AppRoutes />
            </UserProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
