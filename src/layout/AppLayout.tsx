import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useUserContext } from "@/utils/UserContext";
import { useState } from "react";
import UserSelect from "@/components/UserSelect";

export default function AppLayout() {
  const { isVerifying, user } = useUserContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {isVerifying && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <main className="flex-1 overflow-auto">
          {user?.role === "ADMIN" && (
            <div className="w-full flex justify-center py-4 bg-gray-100">
              <div className="w-full max-w-xs">
                <UserSelect />
              </div>
            </div>
          )}
          <div className="container mx-auto py-6 px-4 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
