
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell } from 'recharts';
import { Calendar, Filter, TrendingUp, Users, Target as TargetIcon, DollarSign } from 'lucide-react';

export const Dashboard = () => {
  const { targets, actualData } = useData();
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [metricFilter, setMetricFilter] = useState('all');

  // Calculate KPIs from actual data
  const calculateKPIs = () => {
    if (actualData.length === 0) {
      return {
        totalLeads: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        conversionRate: 0,
        totalBudget: 0,
        funnelCost: 0
      };
    }

    const totals = actualData.reduce((acc, week) => ({
      leads: acc.leads + week.leads,
      appointments: acc.appointments + week.appointmentsSet,
      revenue: acc.revenue + week.salesRevenue,
      budget: acc.budget + week.metaBudgetSpent
    }), { leads: 0, appointments: 0, revenue: 0, budget: 0 });

    return {
      totalLeads: totals.leads,
      totalAppointments: totals.appointments,
      totalRevenue: totals.revenue,
      conversionRate: totals.leads > 0 ? (totals.appointments / totals.leads * 100) : 0,
      totalBudget: totals.budget,
      funnelCost: totals.leads > 0 ? (totals.budget / totals.leads) : 0
    };
  };

  const kpis = calculateKPIs();

  // Prepare chart data
  const chartData = actualData.map(week => ({
    week: week.week,
    leads: week.leads,
    appointmentsSet: week.appointmentsSet,
    appointmentsComplete: week.appointmentsComplete,
    sales: week.sales,
    salesRevenue: week.salesRevenue / 100, // Scale for better visualization
    metaBudgetSpent: week.metaBudgetSpent / 100,
  }));

  // Funnel data
  const funnelData = actualData.length > 0 ? [
    { name: 'Leads', value: kpis.totalLeads, fill: '#3b82f6' },
    { name: 'Appointments Set', value: kpis.totalAppointments, fill: '#10b981' },
    { name: 'Sales', value: actualData.reduce((sum, week) => sum + week.sales, 0), fill: '#f59e0b' },
  ] : [];

  const KPICard = ({ title, value, icon: Icon, format = 'number', trend = 0 }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">
            {format === 'currency' ? `$${value.toLocaleString()}` : 
             format === 'percentage' ? `${value.toFixed(1)}%` :
             value.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Dashboard</h1>
          <p className="text-slate-600 mt-1">Track your key metrics and performance trends</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Leads" 
          value={kpis.totalLeads} 
          icon={Users}
        />
        <KPICard 
          title="Total Appointments" 
          value={kpis.totalAppointments} 
          icon={TargetIcon}
        />
        <KPICard 
          title="Total Revenue" 
          value={kpis.totalRevenue} 
          icon={DollarSign}
          format="currency"
        />
        <KPICard 
          title="Conversion Rate" 
          value={kpis.conversionRate} 
          icon={TrendingUp}
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="appointmentsSet" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" />
              <Bar dataKey="appointmentsSet" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Funnel Chart */}
      {funnelData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">${kpis.funnelCost.toFixed(2)}</p>
            <p className="text-sm text-blue-700">Cost per Lead</p>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{kpis.conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-green-700">Lead to Appointment Rate</p>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">${kpis.totalBudget.toLocaleString()}</p>
            <p className="text-sm text-purple-700">Total Ad Spend</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
