import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullScreenLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ 
  isLoading, 
  message = "Loading...",
  className
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", className)}>
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card border border-border shadow-2xl">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-card-foreground">{message}</p>
      </div>
    </div>
  );
};
