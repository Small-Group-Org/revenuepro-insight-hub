
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CompareResults = () => {
  const { targets, actualData } = useData();

  // Calculate totals from actual data
  const calculateTotals = () => {
    if (actualData.length === 0) {
      return {
        totalLeads: 0,
        totalAppointmentsSet: 0,
        totalAppointmentsComplete: 0,
        totalJobsBooked: 0,
        totalSalesRevenue: 0,
        totalMetaBudgetSpent: 0
      };
    }

    return actualData.reduce((acc, week) => ({
      totalLeads: acc.totalLeads + week.leads,
      totalAppointmentsSet: acc.totalAppointmentsSet + week.appointmentsSet,
      totalAppointmentsComplete: acc.totalAppointmentsComplete + week.appointmentsComplete,
      totalJobsBooked: acc.totalJobsBooked + week.jobsBooked,
      totalSalesRevenue: acc.totalSalesRevenue + week.salesRevenue,
      totalMetaBudgetSpent: acc.totalMetaBudgetSpent + week.metaBudgetSpent
    }), {
      totalLeads: 0,
      totalAppointmentsSet: 0,
      totalAppointmentsComplete: 0,
      totalJobsBooked: 0,
      totalSalesRevenue: 0,
      totalMetaBudgetSpent: 0
    });
  };

  const totals = calculateTotals();

  // Calculate metrics
  const funnelPercentage = totals.totalLeads > 0 ? (totals.totalAppointmentsSet / totals.totalLeads * 100) : 0;
  const funnelCost = totals.totalLeads > 0 ? (totals.totalMetaBudgetSpent / totals.totalLeads) : 0;

  const comparisonData = [
    {
      metric: 'Leads',
      target: targets.leads,
      actual: totals.totalLeads,
      icon: '👥',
      format: 'number'
    },
    {
      metric: 'Appointments Set',
      target: targets.appointmentsSet,
      actual: totals.totalAppointmentsSet,
      icon: '📅',
      format: 'number'
    },
    {
      metric: 'Appointments Complete',
      target: targets.appointmentsComplete,
      actual: totals.totalAppointmentsComplete,
      icon: '✅',
      format: 'number'
    },
    {
      metric: 'Jobs Booked',
      target: targets.jobsBooked,
      actual: totals.totalJobsBooked,
      icon: '🎯',
      format: 'number'
    },
    {
      metric: 'Sales Revenue',
      target: targets.salesRevenue,
      actual: totals.totalSalesRevenue,
      icon: '💰',
      format: 'currency'
    },
    {
      metric: 'Meta Budget Spent',
      target: targets.metaBudgetSpent,
      actual: totals.totalMetaBudgetSpent,
      icon: '📊',
      format: 'currency'
    }
  ];

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return `$${value?.toLocaleString()}`;
    }
    return value?.toLocaleString();
  };

  const calculateDifference = (actual: number, target: number) => {
    return actual - target;
  };

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return (actual / target) * 100;
  };

  const getStatusColor = (actual: number, target: number) => {
    return actual >= target ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (actual: number, target: number) => {
    const percentage = calculatePercentage(actual, target);
    const isPositive = actual >= target;
    
    return (
      <Badge variant={isPositive ? 'default' : 'destructive'} className="ml-2">
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {percentage.toFixed(1)}%
      </Badge>
    );
  };

  const handleDownloadReport = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Target', 'Actual', 'Difference', '% Achieved'],
      ...comparisonData.map(item => [
        item.metric,
        item.target.toString(),
        item.actual.toString(),
        calculateDifference(item.actual, item.target).toString(),
        calculatePercentage(item.actual, item.target).toFixed(1) + '%'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'performance-report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compare & Results</h1>
          <p className="text-slate-600 mt-1">Live comparison of targets vs actual performance</p>
        </div>
        <Button onClick={handleDownloadReport} variant="outline" className="hover:bg-blue-50">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Funnel Conversion Rate</p>
              <p className="text-3xl font-bold text-blue-900">{funnelPercentage.toFixed(1)}%</p>
              <p className="text-xs text-blue-600">Appointments Set / Leads</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Cost per Lead</p>
              <p className="text-3xl font-bold text-green-900">${funnelCost.toFixed(2)}</p>
              <p className="text-xs text-green-600">Meta Budget / Leads</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Overall Performance</p>
              <p className="text-3xl font-bold text-purple-900">
                {comparisonData.filter(item => item.actual >= item.target).length}/{comparisonData.length}
              </p>
              <p className="text-xs text-purple-600">Targets Met</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">📊 Performance Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">Metric</th>
                <th className="text-right p-4 font-semibold text-slate-700">Target</th>
                <th className="text-right p-4 font-semibold text-slate-700">Actual</th>
                <th className="text-right p-4 font-semibold text-slate-700">Difference</th>
                <th className="text-right p-4 font-semibold text-slate-700">Progress</th>
                <th className="text-center p-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, index) => {
                const difference = calculateDifference(item.actual, item.target);
                const percentage = calculatePercentage(item.actual, item.target);
                const isPositive = item.actual >= item.target;
                
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium text-slate-900">{item.metric}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-700">
                      {formatValue(item?.target, item?.format)}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      {formatValue(item.actual, item.format)}
                    </td>
                    <td className={cn("p-4 text-right font-medium", getStatusColor(item.actual, item.target))}>
                      {isPositive ? '+' : ''}{formatValue(Math.abs(difference), item.format)}
                    </td>
                    <td className="p-4">
                      <div className="w-full">
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="h-2"
                        />
                        <p className="text-xs text-slate-600 mt-1 text-right">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(item.actual, item.target)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">💡 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">✅ Strengths</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {comparisonData
                .filter(item => item.actual >= item.target)
                .map((item, index) => (
                  <li key={index}>• {item.metric} exceeded target by {calculatePercentage(item.actual, item.target) - 100 > 0 ? `${(calculatePercentage(item.actual, item.target) - 100).toFixed(1)}%` : '0%'}</li>
                ))}
              {comparisonData.filter(item => item.actual >= item.target).length === 0 && (
                <li>• Focus on improving performance across all metrics</li>
              )}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-red-800">🎯 Areas for Improvement</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {comparisonData
                .filter(item => item.actual < item.target)
                .map((item, index) => (
                  <li key={index}>• {item.metric} is {(100 - calculatePercentage(item.actual, item.target)).toFixed(1)}% below target</li>
                ))}
              {comparisonData.filter(item => item.actual < item.target).length === 0 && (
                <li>• Great job! All targets have been met or exceeded</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
