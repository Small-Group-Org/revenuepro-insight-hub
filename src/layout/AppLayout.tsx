import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useUserContext } from "@/utils/UserContext";
import { useState } from "react";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
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
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
  );
}
