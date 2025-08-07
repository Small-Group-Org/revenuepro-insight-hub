import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateManagementCost, safePercentage, formatCurrencyValue } from "@/utils/page-utils/commonUtils";
import { calculateFields } from "@/utils/page-utils/targetUtils";
import { FieldValue } from "@/types";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Info } from "lucide-react";
import { months } from "@/utils/constant";

export type MonthlyData = {
  budget: number;
  leads: number;
  estimatesSet: number;
  estimates: number;
  sales: number;
  revenue: number;
  avgJobSize: number;
  com: number;
  totalCom: number;
};

interface YearlyTargetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  annualFieldValues: FieldValue;
  onSave: (monthlyData: { [key: string]: MonthlyData }) => Promise<void>;
  isLoading: boolean;
  selectedYear: number;
  apiData?: any[] | null; // Add API data prop
}

const currentMonthIndex = new Date().getMonth();

export const YearlyTargetModal: React.FC<YearlyTargetModalProps> = ({
  isOpen,
  onOpenChange,
  annualFieldValues,
  onSave,
  isLoading,
  selectedYear,
  apiData,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [monthlyData, setMonthlyData] = useState<{
    [key: string]: MonthlyData;
  }>({});

  // Calculate annual totals from the provided field values
  const annualTotals = useMemo(() => {
    const calculated = calculateFields(annualFieldValues, "yearly", 365); // Use 365 days for yearly
    return {
      leads: calculated.leads || 0,
      estimatesSet: calculated.estimatesSet || 0,
      estimates: calculated.estimatesRan || 0,
      sales: calculated.sales || 0,
      revenue: calculated.revenue || 0,
      avgJobSize: calculated.avgJobSize || 0,
      budget: calculated.annualBudget || 0, // Use annual budget directly
      com: calculated.com || 0,
    };
  }, [annualFieldValues]);

  // Process API data into monthly format
  const processApiDataToMonthly = useMemo(() => {
    if (!apiData || apiData.length !== 12) return {};

    const monthlyDataFromApi: { [key: string]: MonthlyData } = {};
    
    // First, calculate total revenue by month and annual total
    const monthlyRevenues: { [key: string]: number } = {};
    let annualRevenue = 0;

    apiData.forEach((monthData, monthIndex) => {
      if (Array.isArray(monthData) && monthData.length > 0) {
        const monthName = months[monthIndex];
        
        // Sum all weekly revenues for this month
        const monthRevenue = monthData.reduce((sum, weekData) => {
          return sum + (weekData.revenue || 0);
        }, 0);
        
        monthlyRevenues[monthName] = monthRevenue;
        annualRevenue += monthRevenue;
      }
    });

    // Now calculate monthly data using the revenue percentages
    apiData.forEach((monthData, monthIndex) => {
      if (Array.isArray(monthData) && monthData.length > 0) {
        const monthName = months[monthIndex];
        const monthRevenue = monthlyRevenues[monthName];
        const revenuePercentage = annualRevenue > 0 ? monthRevenue / annualRevenue : 0;
        
        // Use the annual totals to calculate monthly values based on revenue percentage
        const monthlyBudget = annualTotals.budget * revenuePercentage;
        const managementCost = calculateManagementCost(monthlyBudget);

        monthlyDataFromApi[monthName] = {
          budget: monthlyBudget,
          leads: annualTotals.leads * revenuePercentage,
          estimatesSet: annualTotals.estimatesSet * revenuePercentage,
          estimates: annualTotals.estimates * revenuePercentage,
          sales: annualTotals.sales * revenuePercentage,
          revenue: annualTotals.revenue * revenuePercentage,
          avgJobSize: annualTotals.avgJobSize,
          com: annualTotals.com,
          totalCom: safePercentage(((monthlyBudget + managementCost) / (annualTotals.revenue * revenuePercentage)) * 100),
        };
      }
    });

    return monthlyDataFromApi;
  }, [apiData, annualTotals]);

  // Initialize monthly data from API when modal opens
  useEffect(() => {
    if (isOpen && apiData) {
      const apiMonthlyData = processApiDataToMonthly;
      if (Object.keys(apiMonthlyData).length > 0) {
        setMonthlyData(apiMonthlyData);
      }
    }
  }, [isOpen, apiData, processApiDataToMonthly]);

  // Calculate monthly data based on budget percentages or use API data
  const calculateMonthlyData = useMemo(() => {
    // If we have API data, use it directly
    if (apiData && Object.keys(processApiDataToMonthly).length > 0) {
      return processApiDataToMonthly;
    }

    // Otherwise, calculate based on budget percentages
    const totalBudget = Object.values(monthlyData).reduce(
      (sum, data) => sum + data.budget,
      0
    );
    const newMonthlyData: { [key: string]: MonthlyData } = {};

    months.forEach((month) => {
      const budget = monthlyData[month]?.budget || 0;
      const percentage = totalBudget > 0 ? budget / annualTotals.budget : 0;
      const monthlyRevenue = annualTotals.revenue * percentage;
      const managementCost = calculateManagementCost(budget);

      newMonthlyData[month] = {
        budget,
        leads: annualTotals.leads * percentage,
        estimatesSet: annualTotals.estimatesSet * percentage,
        estimates: annualTotals.estimates * percentage,
        sales: annualTotals.sales * percentage,
        revenue: monthlyRevenue,
        avgJobSize: annualTotals.avgJobSize,
        com: annualTotals.com,
        totalCom: safePercentage(((budget + managementCost) / monthlyRevenue) * 100),
      };
    });

    return newMonthlyData;
  }, [monthlyData, annualTotals, apiData, processApiDataToMonthly]);

  // Update monthly data when calculations change
  useEffect(() => {
    setMonthlyData(calculateMonthlyData);
  }, [calculateMonthlyData]);

  const handleBudgetChange = (month: string, value: number) => {
    const validatedValue = Math.max(0, value);
    
    // Update the budget for this month
    const updatedMonthlyData = { ...monthlyData };
    updatedMonthlyData[month] = {
      ...updatedMonthlyData[month],
      budget: validatedValue,
    };

    // Calculate total budget
    const totalBudget = Object.values(updatedMonthlyData).reduce(
      (sum, data) => sum + data.budget,
      0
    );

    // Recalculate all monthly data based on budget percentages
    const newMonthlyData: { [key: string]: MonthlyData } = {};

    months.forEach((monthName) => {
      const budget = updatedMonthlyData[monthName]?.budget || 0;
      const percentage = totalBudget > 0 ? budget / annualTotals.budget : 0;
      const monthlyRevenue = annualTotals.revenue * percentage;
      const managementCost = calculateManagementCost(budget);

      newMonthlyData[monthName] = {
        budget,
        leads: annualTotals.leads * percentage,
        estimatesSet: annualTotals.estimatesSet * percentage,
        estimates: annualTotals.estimates * percentage,
        sales: annualTotals.sales * percentage,
        revenue: monthlyRevenue,
        avgJobSize: annualTotals.avgJobSize,
        com: annualTotals.com,
        totalCom: safePercentage(((budget + managementCost) / monthlyRevenue) * 100),
      };
    });

    setMonthlyData(newMonthlyData);
  };

  const handleSave = async () => {
    await onSave(monthlyData);
  };

  const handleCancel = () => {
    // Reset to API data if available, otherwise clear everything
    if (apiData && Object.keys(processApiDataToMonthly).length > 0) {
      setMonthlyData(processApiDataToMonthly);
    } else {
      setMonthlyData({});
    }
    setSelectedMonth("January");
    onOpenChange(false);
  };

  const totalBudget = Object.values(monthlyData).reduce(
    (sum, data) => sum + data.budget,
    0
  );
  const selectedMonthData = monthlyData[selectedMonth] || {
    budget: 0,
    leads: 0,
    estimatesSet: 0,
    estimates: 0,
    sales: 0,
    revenue: 0,
    avgJobSize: 0,
    com: 0,
    totalCom: 0,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Monthly Revenue Budgets</DialogTitle>
          <DialogDescription>
            Configure monthly revenue budgets for your yearly targets. The
            calculated values will be distributed proportionally based on each
            month's budget percentage.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Monthly budget inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                Monthly Budgets
              </h3>
                {selectedYear === new Date().getFullYear() &&
                  currentMonthIndex > 0 && (
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-amber-50 border-amber-200 text-amber-800 z-[9999]"
                        >
                          <p className="text-xs">
                            Monthly budgets cannot be updated for past months
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>
              <div className="flex items-center gap-2">
              <Badge
                variant="outline"
              >
                Allocated: {formatCurrencyValue(totalBudget)}
              </Badge>
              <Badge
                variant={
                  annualTotals.budget - totalBudget < 0
                    ? "destructive"
                    : "success"
                }
              >
                Left: {annualTotals.budget - totalBudget >= 0 ? '  ' : '- '}{formatCurrencyValue(Math.abs(annualTotals.budget - totalBudget))}
              </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {months.map((month, idx) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {month}
                    </label>
                  </div>
                  <Input
                    type="number"
                    value={monthlyData[month]?.budget || ""}
                    onChange={(e) =>
                      handleBudgetChange(month, parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="text-sm"
                    onFocus={() => setSelectedMonth(month)}
                    onWheel={(e) => e.currentTarget.blur()}
                    disabled={
                      selectedYear === new Date().getFullYear() &&
                      idx <= currentMonthIndex
                    }
                  />
                  {Number(monthlyData[month]?.budget) > 0 && annualTotals.budget > 0 && (
                    <div className="text-xs text-gray-500">
                      {((monthlyData[month]?.budget / annualTotals.budget) * 100).toFixed(1)}
                      %
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Selected month details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedMonth} Details</h3>
              <Badge variant="outline">
                {monthlyData[selectedMonth]?.budget && annualTotals.budget > 0
                  ? `${(
                      (monthlyData[selectedMonth]?.budget / annualTotals.budget) *
                      100
                    ).toFixed(1)}% of annual`
                  : "0% of annual"}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calculated Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Leads
                    </label>
                    <div className="text-lg font-semibold">
                      {Math.ceil(Number(selectedMonthData.leads))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estimates Set
                    </label>
                    <div className="text-lg font-semibold">
                      {Math.ceil(Number(selectedMonthData.estimatesSet))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estimates
                    </label>
                    <div className="text-lg font-semibold">
                      {Math.ceil(Number(selectedMonthData.estimates))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Sales
                    </label>
                    <div className="text-lg font-semibold">
                      {Math.ceil(Number(selectedMonthData.sales))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Revenue
                    </label>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrencyValue(selectedMonthData.revenue)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Avg Job Size
                    </label>
                    <div className="text-lg font-semibold">
                      {formatCurrencyValue(selectedMonthData.avgJobSize)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Monthly Budget
                    </label>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatCurrencyValue(selectedMonthData.budget)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      CoM%
                    </label>
                    <div className="text-lg font-semibold text-purple-600">
                      {selectedMonthData.com.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Total CoM%
                    </label>
                    <div className="text-lg font-semibold text-purple-600">
                      {selectedMonthData.totalCom.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annual totals reference */}
            <Card className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Annual Totals (Reference)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Total Revenue:{" "}
                    <span className="font-semibold">
                      {formatCurrencyValue(annualTotals.revenue)}
                    </span>
                  </div>
                  <div>
                    Total Budget:{" "}
                    <span className="font-semibold">
                      {formatCurrencyValue(annualTotals.budget)}
                    </span>
                  </div>
                  <div>
                    Total Leads:{" "}
                    <span className="font-semibold">
                      {Math.ceil(Number(annualTotals.leads))}
                    </span>
                  </div>
                  <div>
                    Total Sales:{" "}
                    <span className="font-semibold">
                      {Math.ceil(Number(annualTotals.sales))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || totalBudget !== annualTotals.budget}
          >
            {isLoading ? "Saving..." : "Save Monthly Targets"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
