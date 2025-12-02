import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useUserContext } from "@/utils/UserContext";
import { useState, useEffect } from "react";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useGhlClientStore } from "@/stores/ghlClientStore";

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const { fetchClients, clearClients } = useGhlClientStore();

  // Fetch GHL clients on load when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchClients();
    } else {
      // Clear clients when logged out
      clearClients();
    }
  }, [isLoggedIn, fetchClients, clearClients]);

  const handleLogout = () => {
    clearClients();
    logout();
    navigate("/login");
  };

  return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <TopBar />
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
  );
}
