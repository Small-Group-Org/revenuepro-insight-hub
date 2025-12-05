import { formatCurrencyValue } from "@/utils/page-utils/commonUtils";
import { Card, CardContent, CardTitle, CardHeader } from "../ui/card";

interface TopCardProps {
    title: string;
    icon: React.ReactNode;
    description?: string;
    metrics: Array<{
      label: string;
      value: number;
      format: "currency" | "percent" | "number";
    }>;
    isAdminView?: boolean;
    variant?: 'medium' | 'large';
  }
  
  export const TopCard: React.FC<TopCardProps> = ({
    title,
    icon,
    description,
    metrics,
    isAdminView = false,
    variant = 'medium',
  }) => {
    const formatValue = (val: number, fmt: string) => {
      if (fmt === "currency") {
        return formatCurrencyValue(val);
      }
      if (fmt === "percent") {
        return `${val.toFixed(2)}%`;
      }
      return Math.round(val).toLocaleString();
    };
  
    return (
      <Card className="bg-gradient-to-br from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group hover:scale-105 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className={`text-${variant === 'large' ? 'lg' : 'sm'} font-medium text-card-foreground`}>
                  {title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        <CardContent className="pt-0 relative">
          <div className="min-h-[80px] flex flex-col gap-4 mt-1 justify-center">
                <div className="flex flex-col justify-center">
                  <span
                    className={`font-bold text-card-foreground transition-all duration-300 ${variant === 'large' ? 'text-[30px]' : 'text-[24px]'}`}
                  >
                    {formatValue(metrics[0].value, metrics[0].format)}
                  </span>
                </div>
                {
                  metrics.length === 1 ? (
                    <div className="flex flex-col justify-center mt-auto">
                      <span className="text-[11px] text-muted-foreground/70 italic">
                        {description}
                      </span>
                    </div>
                  ): 
                    (
                      <div className="flex flex-col justify-center mt-auto">
                        <span className="text-xs text-muted-foreground">
                          {metrics[1].label}
                        </span>
                        <span
                          className={`font-bold text-card-foreground transition-all duration-300 text-sm`}
                        >
                          {formatValue(metrics[1].value, metrics[1].format)}
                        </span>
                      </div>
                    )
                  }
          </div>
  
          {/* Bottom right corner icon */}
          <div className="absolute bottom-3 right-3 opacity-40 group-hover:opacity-70 transition-all duration-300">
            <div className="text-2xl">{icon}</div>
          </div>
        </CardContent>
      </Card>
    );
  };