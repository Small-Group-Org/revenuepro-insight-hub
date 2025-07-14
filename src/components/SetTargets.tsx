import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, TrendingUp, Calculator, DollarSign, Target } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePeriodSelector, PeriodType } from './DatePeriodSelector';
import { useTargetStore } from "../stores/targetStore";
import { useUserStore } from "../stores/userStore";
import useAuthStore from "../stores/authStore";
import { endOfWeek, startOfWeek, format } from "date-fns";

type View = 'weekly' | 'monthly' | 'yearly';

// Utility for formatting
const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
const formatPercent = (val: number) => `${val.toFixed(2)}%`;

// Management cost calculation based on ad spend
const calculateManagementCost = (adSpend: number): number => {
  if (adSpend >= 2500 && adSpend <= 5000) return 2000;
  if (adSpend >= 5001 && adSpend <= 10000) return 2500;
  if (adSpend >= 10001 && adSpend <= 15000) return 3000;
  if (adSpend >= 15001 && adSpend <= 20000) return 3500;
  if (adSpend >= 20001 && adSpend <= 25000) return 4000;
  if (adSpend >= 25001 && adSpend <= 30000) return 4500;
  if (adSpend >= 30001 && adSpend <= 35000) return 5000;
  return 2000; // Default for values outside the range
};

// Get days in month for a given date
const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const SetTargets = () => {
  const { toast } = useToast();
  
  // User-editable fields
  const [appointmentRate, setAppointmentRate] = useState(55);
  const [showRate, setShowRate] = useState(70);
  const [closeRate, setCloseRate] = useState(45);
  const [revenue, setRevenue] = useState(6500);
  const [avgJobSize, setAvgJobSize] = useState(6500);
  const [com, setCom] = useState(8);

  // Add state for date/period selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [currentView, setCurrentView] = useState<View>('weekly');

  // API integration state
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );

  // Store hooks
  const { upsertWeeklyTarget, isLoading, error, getTargetsForUser, currentTarget } = useTargetStore();
  const { selectedUserId } = useUserStore();
  const { user } = useAuthStore();

  // Calculate days in month based on selected date
  const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(new Date()));

  // Calculate monthly budget (ad spend)
  const calculatedMonthlyBudget = revenue * (com / 100);
  
  // Calculate management cost based on ad spend
  const managementCost = calculateManagementCost(calculatedMonthlyBudget);

  // Calculated fields using the provided formulas
  const sale = Math.round(revenue / avgJobSize);
  const estimatesRan = Math.round(sale / (closeRate / 100));
  const estimatesSet = Math.round(estimatesRan / (showRate / 100));
  const leads = Math.round(estimatesSet / (appointmentRate / 100));
  
  // Budget calculations
  const dailyBudget = calculatedMonthlyBudget / daysInMonth;
  const cpl = calculatedMonthlyBudget / leads;
  const cpEstimateSet = calculatedMonthlyBudget / estimatesSet;
  const cpEstimate = calculatedMonthlyBudget / estimatesRan;
  const cpJobBooked = calculatedMonthlyBudget / sale;
  const totalCom = ((calculatedMonthlyBudget + managementCost) / revenue) * 100;

  // Lead to Sale calculation (for display purposes)
  const leadToSale = (appointmentRate / 100) * (showRate / 100) * (closeRate / 100) * 100;

  // Track last changed input and previous calculated values
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState({
    sale: Math.round(6500 / 6500),
    estimatesRan: Math.round((6500 / 6500) / (45 / 100)),
    estimatesSet: Math.round((Math.round((6500 / 6500) / (45 / 100))) / (70 / 100)),
    leads: Math.round((Math.round((Math.round((6500 / 6500) / (45 / 100))) / (70 / 100))) / (55 / 100)),
    calculatedMonthlyBudget: 6500 * (8 / 100),
    dailyBudget: (6500 * (8 / 100)) / 30,
    cpl: (6500 * (8 / 100)) / Math.round((Math.round((Math.round((6500 / 6500) / (45 / 100))) / (70 / 100))) / (55 / 100)),
    cpEstimateSet: (6500 * (8 / 100)) / Math.round((Math.round((6500 / 6500) / (45 / 100))) / (70 / 100)),
    cpEstimate: (6500 * (8 / 100)) / Math.round((6500 / 6500) / (45 / 100)),
    cpJobBooked: (6500 * (8 / 100)) / Math.round(6500 / 6500),
    totalCom: (((6500 * (8 / 100)) + 2000) / 6500) * 100,
    leadToSale: (55 / 100) * (70 / 100) * (45 / 100) * 100,
  });

  // Update days in month when selected date changes
  useEffect(() => {
    setDaysInMonth(getDaysInMonth(selectedDate));
  }, [selectedDate]);

  // Update form data when currentTarget changes from API
  useEffect(() => {
    if (currentTarget) {
      setAppointmentRate(currentTarget.appointmentRate ?? 55);
      setShowRate(currentTarget.showRate ?? 70);
      setCloseRate(currentTarget.closeRate ?? 45);
      setRevenue(currentTarget.revenue ?? 6500);
      setAvgJobSize(currentTarget.avgJobSize ?? 6500);
      setCom(((currentTarget.adSpendBudget ?? 520) / (currentTarget.revenue ?? 6500)) * 100);
    }
  }, [currentTarget]);

  // Fetch targets when user, date, or view changes
  useEffect(() => {
    if (user) {
      getTargetsForUser(currentView, selectedStartDate);
    }
  }, [selectedUserId, selectedStartDate, currentView, user, getTargetsForUser]);

  // Helper to determine if a field should be highlighted
  const isHighlighted = (field: keyof typeof prevValues) => {
    if (!lastChanged) return false;
    // Only highlight if value changed due to the last input
    const currentValue = (() => {
      switch (field) {
        case 'sale': return sale;
        case 'estimatesRan': return estimatesRan;
        case 'estimatesSet': return estimatesSet;
        case 'leads': return leads;
        case 'calculatedMonthlyBudget': return calculatedMonthlyBudget;
        case 'dailyBudget': return dailyBudget;
        case 'cpl': return cpl;
        case 'cpEstimateSet': return cpEstimateSet;
        case 'cpEstimate': return cpEstimate;
        case 'cpJobBooked': return cpJobBooked;
        case 'totalCom': return totalCom;
        case 'leadToSale': return leadToSale;
        default: return 0;
      }
    })();
    return prevValues[field] !== currentValue;
  };

  // Update prevValues and lastChanged on input change
  const handleInputChange = (field: string, value: number) => {
    setLastChanged(field);
    setPrevValues({
      sale,
      estimatesRan,
      estimatesSet,
      leads,
      calculatedMonthlyBudget,
      dailyBudget,
      cpl,
      cpEstimateSet,
      cpEstimate,
      cpJobBooked,
      totalCom,
      leadToSale,
    });
    switch (field) {
      case 'appointmentRate': setAppointmentRate(value); break;
      case 'showRate': setShowRate(value); break;
      case 'closeRate': setCloseRate(value); break;
      case 'revenue': setRevenue(value); break;
      case 'avgJobSize': setAvgJobSize(value); break;
      case 'com': setCom(value); break;
      default: break;
    }
  };

  const handleSave = async () => {
    try {
      await upsertWeeklyTarget({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: currentView,
        leads: leads || 0,
        revenue: revenue || 0,
        avgJobSize: avgJobSize || 0,
        appointmentRate: appointmentRate || 0,
        showRate: showRate || 0,
        closeRate: closeRate || 0,
        adSpendBudget: calculatedMonthlyBudget || 0,
        costPerLead: cpl || 0,
        costPerEstimateSet: cpEstimateSet || 0,
        costPerJobBooked: cpJobBooked || 0,
      });

      toast({
        title: "✅ Targets Saved Successfully!",
        description: `Your ${currentView} target values have been updated.`,
      });
    } catch (err) {
      toast({
        title: "❌ Error Saving Targets",
        description: error || "Failed to save targets. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDatePeriodChange = (date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
    // Reset highlighting when date or period changes
    setLastChanged(null);
    console.log('DatePeriodSelector changed:', date, period);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="relative z-10 py-12 px-4">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
                <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Set Targets
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Configure your business targets and KPIs with precision
            </p>
          </div>
        </div>

        {/* DatePeriodSelector at the top */}
        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Targets"
            onButtonClick={handleSave}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Funnel Rates Card */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xld">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Funnel Rates</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentRate" className="text-sm font-medium text-gray-700">
                    Appointment Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="appointmentRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={appointmentRate}
                      onChange={(e) => handleInputChange('appointmentRate', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="showRate" className="text-sm font-medium text-gray-700">
                    Show Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="showRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={showRate}
                      onChange={(e) => handleInputChange('showRate', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closeRate" className="text-sm font-medium text-gray-700">
                    Close Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="closeRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={closeRate}
                      onChange={(e) => handleInputChange('closeRate', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Calculated Field */}
              <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/40 ${isHighlighted('leadToSale') ? 'bg-gradient-to-r from-sky-100/80 border-blue-500 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Lead to Sale</div>
                    <div className="text-[10px] mt-[2px] text-gray-500">Appointment × Show × Close</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{formatPercent(leadToSale)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Monthly Targets Card */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xld">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-green-50/50 to-blue-50/50">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Monthly Targets</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue" className="text-sm font-medium text-gray-700">
                    Revenue
                  </Label>
                  <div className="relative">
                    <Input
                      id="revenue"
                      type="number"
                      min={0}
                      value={revenue}
                      onChange={(e) => handleInputChange('revenue', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avgJobSize" className="text-sm font-medium text-gray-700">
                    Avg Job Size
                  </Label>
                  <div className="relative">
                    <Input
                      id="avgJobSize"
                      type="number"
                      min={0}
                      value={avgJobSize}
                      onChange={(e) => handleInputChange('avgJobSize', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  </div>
                </div>
              </div>

              {/* Calculated Fields */}
              <div className="space-y-3">
                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('sale') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Sales</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Revenue ÷ Avg Job Size</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{sale}</span>
                  </div>
                </div>
                
                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('estimatesRan') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Estimates Ran</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Sales ÷ Close Rate</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{estimatesRan}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('estimatesSet') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Estimates Set</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Estimates Ran ÷ Show Rate</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{estimatesSet}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('leads') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Leads</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Estimates Set ÷ Appointment Rate</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{leads}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Budget Targets Card */}
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xld">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Budget Targets</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="com" className="text-sm font-medium text-gray-700">
                    CoM%
                  </Label>
                  <div className="relative">
                    <Input
                      id="com"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={com}
                      onChange={(e) => handleInputChange('com', Number(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="appearance-none pr-12"
                      style={{ MozAppearance: 'textfield' }}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Calculated Fields */}
              <div className="space-y-3">
                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('calculatedMonthlyBudget') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Monthly Budget (Ad Spend)</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Revenue × CoM%</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(calculatedMonthlyBudget)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 hover:shadow-mdd">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Management Cost</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Based on Ad Spend Range</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(managementCost)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('dailyBudget') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Daily Budget</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Monthly Budget ÷ Days in Month</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(dailyBudget)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('cpl') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Cost Per Lead</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Monthly Budget ÷ Leads</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(cpl)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('cpEstimateSet') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">CP Estimate Set</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Monthly Budget ÷ Estimates Set</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(cpEstimateSet)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('cpEstimate') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">CP Estimate</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Monthly Budget ÷ Estimates Ran</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(cpEstimate)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('cpJobBooked') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">CP Job Booked</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">Monthly Budget ÷ Sales</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(cpJobBooked)}</span>
                  </div>
                </div>

                <div className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${isHighlighted('totalCom') ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' : 'hover:shadow-mdd'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total CoM%</div>
                      <div className="text-[10px] mt-[2px] text-gray-500">(Monthly Budget + Management Cost) ÷ Revenue</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPercent(totalCom)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};