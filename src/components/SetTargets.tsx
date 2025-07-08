import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Target } from "lucide-react";
import { useTargetStore } from "../stores/targetStore";
import { DateSelect } from "./DateSelect";
import { useUserStore } from "../stores/userStore";
import useAuthStore from "../stores/authStore";
import { endOfWeek, startOfWeek, format } from "date-fns";

type View = 'weekly' | 'monthly' | 'yearly'; // Define the View type

export const SetTargets = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    leads: 120,
    appointmentsSet: 60,
    appointmentsComplete: 50,
    jobsBooked: 25,
    salesRevenue: 30000,
    metaBudgetSpent: 6000,
  });
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const { upsertWeeklyTarget, isLoading, error, getTargetsForUser, currentTarget } =
    useTargetStore();
  const { selectedUserId } = useUserStore();
  const { user } = useAuthStore();
  const [currentView, setCurrentView] = useState<View>('weekly');

  // Update formData when currentTarget changes
  useEffect(() => {
    if (currentTarget) {
      setFormData({
        leads: currentTarget.leads ?? 0,
        appointmentsSet: currentTarget.appointmentRate
          ? Math.round((currentTarget.leads * currentTarget.appointmentRate) / 100)
          : 0,
        appointmentsComplete:
          currentTarget.showRate && currentTarget.appointmentRate
            ? Math.round(
                (currentTarget.leads * currentTarget.appointmentRate * currentTarget.showRate) /
                  10000
              )
            : 0,
        jobsBooked:
          currentTarget.closeRate && currentTarget.showRate && currentTarget.appointmentRate
            ? Math.round(
                (currentTarget.leads *
                  currentTarget.appointmentRate *
                  currentTarget.showRate *
                  currentTarget.closeRate) /
                  1000000
              )
            : 0,
        salesRevenue: currentTarget.revenue ?? 0,
        metaBudgetSpent: currentTarget.adSpendBudget ?? 0,
      });
    } else {
        // Optionally, reset the form if no target is found for the period
        setFormData({
            leads: 0,
            appointmentsSet: 0,
            appointmentsComplete: 0,
            jobsBooked: 0,
            salesRevenue: 0,
            metaBudgetSpent: 0,
        });
    }
  }, [currentTarget]); // Simplified dependency

  // This useEffect will now only run ONCE per user action because the
  // state updates that trigger it are batched.
  useEffect(() => {
    if (user) { // Ensure user is available before fetching
      getTargetsForUser(currentView, selectedStartDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, selectedStartDate, currentView, user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSave = async () => {
    try {
      // Logic for upserting targets based on the view
      await upsertWeeklyTarget({ // This likely needs to be a more generic `upsertTarget`
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: currentView, // Use the current view
        leads: formData.leads || 0,
        revenue: formData.salesRevenue || 0,
        avgJobSize: formData.salesRevenue / formData.jobsBooked || 0,
        appointmentRate: (formData.appointmentsSet / formData.leads) * 100 || 0,
        showRate: (formData.appointmentsComplete / formData.appointmentsSet) * 100 || 0,
        closeRate: (formData.jobsBooked / formData.appointmentsComplete) * 100 || 0,
        adSpendBudget: formData.metaBudgetSpent || 0,
        costPerLead: formData.metaBudgetSpent / formData.leads || 0,
        costPerEstimateSet: formData.metaBudgetSpent / formData.appointmentsSet || 0,
        costPerJobBooked: formData.metaBudgetSpent / formData.jobsBooked || 0,
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

  const targetFields = [
    { key: "leads", label: "Leads Target", icon: "👥" },
    { key: "appointmentsSet", label: "Appointments Set Target", icon: "📅" },
    { key: "appointmentsComplete", label: "Appointments Complete Target", icon: "✅" },
    { key: "jobsBooked", label: "Jobs Booked Target", icon: "🎯" },
    { key: "salesRevenue", label: "Sales Revenue Target ($)", icon: "💰" },
    { key: "metaBudgetSpent", label: "Meta Budget Spent Target ($)", icon: "📊" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Set Performance Targets</h1>
          <p className="text-slate-600 mt-1">Define your performance goals and benchmarks</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Targets'}
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex justify-between items-center">
        <DateSelect
          // Use the new single callback
          onSelectionChange={({ view, startDate, endDate }) => {
            // React 18+ batches these updates, causing a single re-render and effect run
            setCurrentView(view);
            setSelectedStartDate(startDate);
            setSelectedEndDate(endDate);
          }}
          initialView="weekly"
        />
        <div className="text-sm text-slate-600">Values shown are <span className="font-semibold">{currentView}</span> targets</div>
      </div>

      {/* Targets Form (No changes needed here) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {targetFields.map(({ key, label, icon }) => (
          <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <Label htmlFor={key} className="text-lg font-semibold text-slate-900">
                  {label}
                </Label>
              </div>
              <p className="text-sm text-slate-600">
                Enter target for the selected <span className="font-semibold">{currentView}</span> period.
              </p>
            </div>
            <div className="relative">
              <Input
                id={key}
                type="number"
                value={formData[key as keyof typeof formData]}
                onChange={(e) => handleInputChange(key as keyof typeof formData, e.target.value)}
                className="text-lg font-medium bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
                placeholder="0"
                disabled={isLoading}
              />
              {(key === "salesRevenue" || key === "metaBudgetSpent") && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  $
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Target Summary (No changes needed here) */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-900">{currentView.charAt(0).toUpperCase() + currentView.slice(1)} Target Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {targetFields.map(({ key, label, icon }) => (
            <div key={key} className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-lg">{icon}</div>
              <div className="text-2xl font-bold text-slate-900">
                {key === "salesRevenue" || key === "metaBudgetSpent"
                  ? `$${formData[key as keyof typeof formData]?.toLocaleString()}`
                  : formData[key as keyof typeof formData]?.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600">{label.replace(" Target", "")}</div>
            </div>
          ))}
        </div>
      </Card>
      
       {/* Help Text (No changes needed here) */}
       <Card className="p-6 bg-amber-50 border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 Tips for Setting Targets</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Base targets on historical performance and growth goals.</li>
          <li>• The targets you set for a specific period (e.g., a week) apply to that period only.</li>
          <li>• Ensure targets are challenging but achievable for the selected timeframe.</li>
        </ul>
      </Card>
    </div>
  );
};