import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrencyValue } from '@/utils/page-utils/commonUtils';

interface DualMetricChartProps {
  chartData: Array<{
    week: string;
    metric1Actual: number;
    metric2Actual: number;
  }>;
  title: string;
  description?: string;
  metric1Config: {
    key: string;
    title: string;
    actualColor: string;
    format: string;
  };
  metric2Config: {
    key: string;
    title: string;
    actualColor: string;
    format: string;
  };
  icon?: React.ReactNode;
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

// Custom tooltip component for dual metrics
const DualMetricTooltip = ({ active, payload, label, metric1Config, metric2Config }: any) => {
  if (active && payload && payload.length) {
    const metric1Actual = payload.find((p: any) => p.dataKey === 'metric1Actual')?.value || 0;
    const metric2Actual = payload.find((p: any) => p.dataKey === 'metric2Actual')?.value || 0;
    
    return (
      <div className="bg-card rounded-lg shadow-lg p-4 min-w-[220px]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-card-foreground mb-1">{label}</p>
          <div className="w-full h-0.5 bg-gradient-primary rounded"></div>
        </div>
        
        <div className="space-y-3">
          {/* Metric 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric1Config.actualColor }}></div>
              <span className="text-xs font-medium text-card-foreground">{metric1Config.title}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: metric1Config.actualColor }}>
              {formatValue(metric1Actual, metric1Config.format)}
            </span>
          </div>
          
          {/* Metric 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric2Config.actualColor }}></div>
              <span className="text-xs font-medium text-card-foreground">{metric2Config.title}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: metric2Config.actualColor }}>
              {formatValue(metric2Actual, metric2Config.format)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DualMetricChart: React.FC<DualMetricChartProps> = ({ 
  chartData, 
  title, 
  metric1Config,
  metric2Config,
  icon 
}) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="week" fontSize={12} />
          
          {/* Left Y-axis for Metric 1 */}
          <YAxis 
            yAxisId="left" 
            fontSize={12}
            tickFormatter={(value) => formatValue(value, metric1Config.format)}
          />
          
          {/* Right Y-axis for Metric 2 */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            fontSize={12}
            tickFormatter={(value) => formatValue(value, metric2Config.format)}
          />
          
          <Tooltip 
            content={<DualMetricTooltip metric1Config={metric1Config} metric2Config={metric2Config} />}
            cursor={{ strokeDasharray: '3 3', stroke: '#e2e8f0' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconSize={12}
            iconType="line"
          />
          
          {/* Metric 1 Line */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="metric1Actual" 
            stroke={metric1Config.actualColor} 
            strokeWidth={3}
            dot={{ fill: metric1Config.actualColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: metric1Config.actualColor, strokeWidth: 2 }}
            name={metric1Config.title}
          />
          
          {/* Metric 2 Line */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="metric2Actual" 
            stroke={metric2Config.actualColor} 
            strokeWidth={3}
            dot={{ fill: metric2Config.actualColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: metric2Config.actualColor, strokeWidth: 2 }}
            name={metric2Config.title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 