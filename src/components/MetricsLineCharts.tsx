import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrencyValue } from '@/utils/page-utils/commonUtils';

interface MetricsLineChartsProps {
  comprehensiveChartData: {
    [key: string]: Array<{
      week: string;
      actual: number;
      target: number;
      format: string;
    }>;
  };
}

// Chart configuration for each metric
const chartConfigs = [
  {
    key: 'totalCom',
    title: 'Total CoM%',
    actualColor: '#3b82f6',
    targetColor: '#10b981',
    format: 'percent'
  },
  {
    key: 'revenue',
    title: 'Total Revenue',
    actualColor: '#10b981',
    targetColor: '#059669',
    format: 'currency'
  },
  {
    key: 'cpEstimateSet',
    title: 'Cost per Appointment Set',
    actualColor: '#f59e0b',
    targetColor: '#d97706',
    format: 'currency'
  },
  {
    key: 'cpl',
    title: 'Cost Per Lead',
    actualColor: '#ef4444',
    targetColor: '#dc2626',
    format: 'currency'
  },
  {
    key: 'appointmentRate',
    title: 'Appointment Rate',
    actualColor: '#8b5cf6',
    targetColor: '#7c3aed',
    format: 'percent'
  },
  {
    key: 'showRate',
    title: 'Show Rate',
    actualColor: '#06b6d4',
    targetColor: '#0891b2',
    format: 'percent'
  },
  {
    key: 'closeRate',
    title: 'Close Rate',
    actualColor: '#84cc16',
    targetColor: '#65a30d',
    format: 'percent'
  },
  {
    key: 'avgJobSize',
    title: 'Average Job Size',
    actualColor: '#f97316',
    targetColor: '#ea580c',
    format: 'currency'
  }
];

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
const CustomTooltip = ({ active, payload, label, format }: any) => {
  if (active && payload && payload.length) {
    const actualValue = payload[0]?.value || 0;
    const targetValue = payload[1]?.value || 0;
    
    // Calculate performance metrics
    const performancePercent = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
    const difference = actualValue - targetValue;
    const differencePercent = targetValue > 0 ? (difference / targetValue) * 100 : 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">Actual</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {formatValue(actualValue, format)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Target</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {formatValue(targetValue, format)}
            </span>
          </div>
          
          {/* Performance metrics */}
          {targetValue > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Performance</span>
                <span className={`text-xs font-semibold ${
                  performancePercent >= 100 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {performancePercent.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Difference</span>
                <span className={`text-xs font-semibold ${
                  difference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {difference >= 0 ? '+' : ''}{formatValue(difference, format)}
                  <span className="ml-1">
                    ({differencePercent >= 0 ? '+' : ''}{differencePercent.toFixed(1)}%)
                  </span>
                </span>
              </div>
              
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    performancePercent >= 100 ? 'bg-green-500' : 'bg-red-500'
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

export const MetricsLineCharts: React.FC<MetricsLineChartsProps> = ({ comprehensiveChartData }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">Comprehensive Metrics Comparison</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {chartConfigs.map((config) => (
          <div key={config.key} className="space-y-3">
            <h4 className="text-base font-medium text-slate-700">{config.title}</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={comprehensiveChartData[config.key]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  content={<CustomTooltip format={config.format} />}
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
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-sm text-gray-600">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500 border-dashed border-green-500"></div>
          <span className="text-sm text-gray-600">Target</span>
        </div>
      </div>
    </Card>
  );
}; 