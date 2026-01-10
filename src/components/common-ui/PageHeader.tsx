import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  iconClassName?: string;
}

export const PageHeader = ({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
}: PageHeaderProps) => {
  return (
    <div className={cn("text-center mb-8", className)}>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div
          className={cn(
            "w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-center shadow-lg",
            iconClassName
          )}
        >
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
          {title}
        </h1>
      </div>
      <p className="text-muted-foreground max-w-4xl mx-auto text-lg mb-6 mt-2">
        {description}
      </p>
    </div>
  );
};
