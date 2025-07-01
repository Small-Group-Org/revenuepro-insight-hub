
import React from 'react';
import { BarChart3, Target, Plus, TrendingUp, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'targets', label: 'Set Targets', icon: Target },
  { id: 'actuals', label: 'Add Actual Data', icon: Plus },
  { id: 'compare', label: 'Compare & Results', icon: TrendingUp },
];

export const Sidebar = ({ activeSection, onSectionChange, isCollapsed, onToggleCollapse }: SidebarProps) => {
  return (
    <div className={cn(
      "bg-slate-900 text-white transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              RevenuePRO AI
            </h1>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "hover:bg-slate-800",
                activeSection === id 
                  ? "bg-blue-600 shadow-md" 
                  : "text-slate-300"
              )}
            >
              <Icon size={20} />
              {!isCollapsed && (
                <span className="font-medium">{label}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className={cn(
          "text-xs text-slate-400",
          isCollapsed ? "text-center" : ""
        )}>
          {isCollapsed ? "v1.0" : "RevenuePRO AI v1.0"}
        </div>
      </div>
    </div>
  );
};
