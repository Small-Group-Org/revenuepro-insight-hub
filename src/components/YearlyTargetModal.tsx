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
import { calculateAllFields } from "@/utils/utils";
import { FieldValue } from "@/types";

export type MonthlyData = {
  budget: number;
  leads: number;
  estimatesSet: number;
  estimates: number;
  sales: number;
  revenue: number;
  avgJobSize: number;
  com: number;
};

interface YearlyTargetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  annualFieldValues: FieldValue;
  onSave: (monthlyData: { [key: string]: MonthlyData }) => Promise<void>;
  isLoading: boolean;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentMonthIndex = new Date().getMonth();

export const YearlyTargetModal: React.FC<YearlyTargetModalProps> = ({
  isOpen,
  onOpenChange,
  annualFieldValues,
  onSave,
  isLoading
}) => {
  const [monthlyBudgets, setMonthlyBudgets] = useState<{ [key: string]: number }>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: MonthlyData }>({});

  // Calculate annual totals from the provided field values
  const annualTotals = useMemo(() => {
    const calculated = calculateAllFields(annualFieldValues, 365, 'yearly'); // Use 365 days for yearly
    return {
      leads: calculated.leads || 0,
      estimatesSet: calculated.estimatesSet || 0,
      estimates: calculated.estimatesRan || 0,
      sales: calculated.sales || 0,
      revenue: calculated.revenue || 0,
      avgJobSize: calculated.avgJobSize || 0,
      budget: calculated.annualBudget || 0, // Use annual budget directly
      com: calculated.com || 0
    };
  }, [annualFieldValues]);

  // Calculate monthly data based on budget percentages
  const calculateMonthlyData = useMemo(() => {
    const totalBudget = Object.values(monthlyBudgets).reduce((sum, budget) => sum + budget, 0);
    const newMonthlyData: { [key: string]: MonthlyData } = {};

    months.forEach(month => {
      const budget = monthlyBudgets[month] || 0;
      const percentage = totalBudget > 0 ? (budget / totalBudget) : 0;

      newMonthlyData[month] = {
        budget,
        leads: Math.round(annualTotals.leads * percentage),
        estimatesSet: Math.round(annualTotals.estimatesSet * percentage),
        estimates: Math.round(annualTotals.estimates * percentage),
        sales: Math.round(annualTotals.sales * percentage),
        revenue: Math.round(annualTotals.revenue * percentage),
        avgJobSize: annualTotals.avgJobSize, // Keep same as annual
        com: annualTotals.com // Keep same as annual
      };
    });

    return newMonthlyData;
  }, [monthlyBudgets, annualTotals]);

  // Update monthly data when calculations change
  useEffect(() => {
    setMonthlyData(calculateMonthlyData);
  }, [calculateMonthlyData]);

  const handleBudgetChange = (month: string, value: number) => {
    const validatedValue = Math.max(0, value);
    setMonthlyBudgets(prev => ({
      ...prev,
      [month]: validatedValue
    }));
  };

  const handleSave = async () => {
    await onSave(monthlyData);
  };

  const totalBudget = Object.values(monthlyBudgets).reduce((sum, budget) => sum + budget, 0);
  const selectedMonthData = monthlyData[selectedMonth] || {
    budget: 0,
    leads: 0,
    estimatesSet: 0,
    estimates: 0,
    sales: 0,
    revenue: 0,
    avgJobSize: 0,
    com: 0
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Monthly Revenue Budgets</DialogTitle>
          <DialogDescription>
            Configure monthly revenue budgets for your yearly targets. The calculated values will be distributed proportionally based on each month's budget percentage.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Monthly budget inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Monthly Budgets</h3>
              <Badge variant="secondary">
                Total: ${totalBudget.toLocaleString()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {months.map((month, idx) => (
                <div key={month} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {month}
                  </label>
                  <Input
                    type="number"
                    value={monthlyBudgets[month] || ""}
                    onChange={(e) => handleBudgetChange(month, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="text-sm"
                    onFocus={() => setSelectedMonth(month)}
                    disabled={idx <= currentMonthIndex}
                  />
                  {monthlyBudgets[month] && totalBudget > 0 && (
                    <div className="text-xs text-gray-500">
                      {((monthlyBudgets[month] / totalBudget) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Selected month details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedMonth} Details
              </h3>
              <Badge variant="outline">
                {monthlyBudgets[selectedMonth] && totalBudget > 0 
                  ? `${((monthlyBudgets[selectedMonth] / totalBudget) * 100).toFixed(1)}% of annual`
                  : "0% of annual"
                }
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calculated Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">LEADS</label>
                    <div className="text-lg font-semibold">{selectedMonthData.leads.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ESTIMATES SET</label>
                    <div className="text-lg font-semibold">{selectedMonthData.estimatesSet.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ESTIMATES</label>
                    <div className="text-lg font-semibold">{selectedMonthData.estimates.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">SALES</label>
                    <div className="text-lg font-semibold">{selectedMonthData.sales.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">REVENUE</label>
                    <div className="text-lg font-semibold text-green-600">
                      ${selectedMonthData.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">AVG JOB SIZE</label>
                    <div className="text-lg font-semibold">
                      ${selectedMonthData.avgJobSize.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">MONTHLY BUDGET</label>
                    <div className="text-lg font-semibold text-blue-600">
                      ${selectedMonthData.budget.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">CoM%</label>
                    <div className="text-lg font-semibold text-purple-600">
                      {selectedMonthData.com.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annual totals reference */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base">Annual Totals (Reference)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Revenue: <span className="font-semibold">${annualTotals.revenue.toLocaleString()}</span></div>
                  <div>Total Budget: <span className="font-semibold">${annualTotals.budget.toLocaleString()}</span></div>
                  <div>Total Leads: <span className="font-semibold">{annualTotals.leads.toLocaleString()}</span></div>
                  <div>Total Sales: <span className="font-semibold">{annualTotals.sales.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Monthly Targets"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 