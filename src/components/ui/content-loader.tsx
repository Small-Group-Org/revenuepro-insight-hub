import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

/**
 * ContentLoader - Only covers the main content area (not sidebar or navbar)
 * Use this for page-level loading states
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  isLoading, 
  message = "Loading...",
  className
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-card-foreground">{message}</p>
      </div>
    </div>
  );
};

