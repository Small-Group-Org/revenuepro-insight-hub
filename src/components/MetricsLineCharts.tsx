import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, DollarSign } from 'lucide-react';
import { formatCurrencyValue } from '@/utils/page-utils/commonUtils';

interface ChartConfig {
  key: string;
  title: string;
  description?: string;
  actualColor: string;
  targetColor: string;
  format: string;
}

interface MetricsLineChartsProps {
  chartData: {
    [key: string]: Array<{
      week: string;
      actual: number | null;
      target: number | null;
      format: string;
      message?: string;
    }>;
  };
  chartConfigs: ChartConfig[];
  title: string;
  icon?: React.ReactNode;
  gridCols?: string;
}

// Format value helper
const formatValue = (value: number, format: string) => {
  if (format === "currency") {
    return formatCurrencyValue(value);
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  return Math.round(value)?.toLocaleString();
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, format, actualColor, targetColor }: any) => {
  if (active && payload && payload.length) {
    const actualValue = payload[0]?.value || 0;
    const targetValue = payload[1]?.value || 0;
    
    // Calculate performance metrics
    const performancePercent = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
    const difference = actualValue - targetValue;
    const differencePercent = targetValue > 0 ? (difference / targetValue) * 100 : 0;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[220px]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-card-foreground mb-1">{label}</p>
          <div className="w-full h-0.5 bg-gradient-primary rounded"></div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: actualColor }}></div>
              <span className="text-sm font-medium text-card-foreground">Actual</span>
            </div>
            <span className="text-sm font-bold" style={{ color: actualColor }}>
              {formatValue(actualValue, format)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: targetColor }}></div>
              <span className="text-sm font-medium text-card-foreground">Target</span>
            </div>
            <span className="text-sm font-bold" style={{ color: targetColor }}>
              {formatValue(targetValue, format)}
            </span>
          </div>
          
          {/* Performance metrics */}
          {targetValue > 0 && (
            <div className="mt-3 pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Performance</span>
                <span className={`text-xs font-semibold ${
                  performancePercent >= 100 ? 'text-success' : 'text-destructive'
                }`}>
                  {performancePercent.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Difference</span>
                <span className={`text-xs font-semibold ${
                  difference >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {difference >= 0 ? '+' : ''}{formatValue(difference, format)}
                  <span className="ml-1">
                    ({differencePercent >= 0 ? '+' : ''}{differencePercent.toFixed(1)}%)
                  </span>
                </span>
              </div>
              
              <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    performancePercent >= 100 ? 'bg-success' : 'bg-destructive'
                  }`}
                  style={{ 
                    width: `${Math.min(performancePercent, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const MetricsLineCharts: React.FC<MetricsLineChartsProps> = ({ 
  chartData, 
  chartConfigs, 
  title, 
  icon = <BarChart3 className="h-5 w-5 text-primary" />,
  gridCols = "grid-cols-1 lg:grid-cols-2"
}) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-[20px] font-semibold text-card-foreground">{title}</h3>
      </div>
      
      <div className={`grid ${gridCols} gap-8`}>
        {chartConfigs.map((config) => {
          const chartDataForConfig = chartData[config.key];
          const hasMessage = chartDataForConfig && chartDataForConfig.some(item => item.message);
          
          return (
            <div key={config.key} className="space-y-3">
              <div>
                <h4 className="text-base font-medium text-card-foreground">{config.title}</h4>
              </div>
              
              {hasMessage ? (
                <div className="h-[250px] flex items-center justify-center bg-muted/50 rounded-lg border border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                      {chartDataForConfig[0]?.message || "Data not available"}
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData[config.key]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" fontSize={12} />
                    <YAxis 
                      fontSize={12} 
                      domain={config.format === "percent" ? [0, 100] : undefined}
                      tickFormatter={config.format === "percent" ? (value) => `${value}%` : 
                                   config.format === "currency" ? (value) => `$${value.toLocaleString()}` : undefined}
                    />
                    <Tooltip 
                      content={<CustomTooltip format={config.format} actualColor={config.actualColor} targetColor={config.targetColor} />}
                      cursor={{ strokeDasharray: '3 3', stroke: '#e2e8f0' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke={config.actualColor} 
                      strokeWidth={3}
                      dot={{ fill: config.actualColor, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: config.actualColor, strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke={config.targetColor} 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: config.targetColor, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: config.targetColor, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {/* Individual chart legend - only show if no message */}
              {!hasMessage && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <div className="w-1 h-0.5" style={{ backgroundColor: config.targetColor }}></div>
                      <div className="w-1 h-0.5" style={{ backgroundColor: 'white' }}></div>
                      <div className="w-1 h-0.5" style={{ backgroundColor: config.targetColor }}></div>
                      <div className="w-1 h-0.5" style={{ backgroundColor: 'white' }}></div>
                      <div className="w-1 h-0.5" style={{ backgroundColor: config.targetColor }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-dashed" style={{ 
                      backgroundColor: config.actualColor,
                      borderColor: config.actualColor 
                    }}></div>
                    <span className="text-xs text-muted-foreground">Target</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}; 