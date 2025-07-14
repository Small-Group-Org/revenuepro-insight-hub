import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";
import { DatePeriodSelector } from './DatePeriodSelector';
import { TargetSection } from './TargetSection';
import { YearlyTargetModal } from './YearlyTargetModal';
import { useTargetStore } from "../stores/targetStore";
import { useUserStore } from "../stores/userStore";
import useAuthStore from "../stores/authStore";
import { endOfWeek, startOfWeek, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { getDaysInMonth } from "@/utils/utils";
import { targetFields } from "@/utils/constant";
import { FieldConfig, FieldValue, InputField, PeriodType } from "@/types";
import { calculateAllFields, getDefaultValues } from "@/utils/utils";

export const SetTargets = () => {
  const { toast } = useToast();
  
  const [fieldValues, setFieldValues] = useState<FieldValue>(getDefaultValues());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(new Date()));
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);

  const { upsertWeeklyTarget, isLoading, error, getTargetsForUser, currentTarget } = useTargetStore();
  const { selectedUserId } = useUserStore();
  const { user } = useAuthStore();

  // Memoize calculatedValues to prevent recalculation on every render
  const calculatedValues = useMemo(() => 
    calculateAllFields(fieldValues, daysInMonth, period), 
    [fieldValues, daysInMonth, period]
  );

  useEffect(() => {
    setDaysInMonth(getDaysInMonth(selectedDate));
  }, [selectedDate]);

  // Update start and end dates when selected date or period changes
  useEffect(() => {
    let startDate: Date;
    let endDate: Date;

    if (period === 'weekly') {
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
    } else if (period === 'monthly') {
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else {
      startDate = startOfYear(selectedDate);
      endDate = endOfYear(selectedDate);
    }

    setSelectedStartDate(format(startDate, 'yyyy-MM-dd'));
    setSelectedEndDate(format(endDate, 'yyyy-MM-dd'));
  }, [selectedDate, period]);

  // Initialize prevValues only once
  useEffect(() => {
    setPrevValues(calculatedValues);
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (currentTarget) {
      const newValues = { ...getDefaultValues() };
      
      if (currentTarget.appointmentRate !== undefined) newValues.appointmentRate = currentTarget.appointmentRate;
      if (currentTarget.showRate !== undefined) newValues.showRate = currentTarget.showRate;
      if (currentTarget.closeRate !== undefined) newValues.closeRate = currentTarget.closeRate;
      if (currentTarget.revenue !== undefined) newValues.revenue = currentTarget.revenue;
      if (currentTarget.avgJobSize !== undefined) newValues.avgJobSize = currentTarget.avgJobSize;
      
      if (currentTarget.adSpendBudget !== undefined && currentTarget.revenue !== undefined) {
        newValues.com = (currentTarget.adSpendBudget / currentTarget.revenue) * 100;
      }
      
      setFieldValues(newValues);
    }
  }, [currentTarget]);

  useEffect(() => {
    if (user) {
      getTargetsForUser(period, selectedStartDate);
    }
  }, [selectedUserId, selectedStartDate, period, user]); // Remove getTargetsForUser dependency

  const isHighlighted = useCallback((fieldName: string) => {
    if (!lastChanged) return false;
    return prevValues[fieldName] !== calculatedValues[fieldName];
  }, [lastChanged, prevValues, calculatedValues]);

  const handleInputChange = useCallback((fieldName: string, value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      value = 0;
    }
    
    const validatedValue = Math.max(0, value);

    setLastChanged(fieldName);
    setPrevValues(calculatedValues);
    
    const field = findFieldByName(fieldName);
    if (field && field.fieldType === 'input') {
      const inputField = field as InputField;
      let finalValue = validatedValue;
      
      if (inputField.max !== undefined) {
        finalValue = Math.min(finalValue, inputField.max);
      }
      if (inputField.min !== undefined) {
        finalValue = Math.max(finalValue, inputField.min);
      }

      setFieldValues(prev => ({
        ...prev,
        [fieldName]: finalValue
      }));
    }
  }, [calculatedValues]);

  const findFieldByName = useCallback((fieldName: string): FieldConfig | null => {
    for (const section of Object.values(targetFields)) {
      const field = section.find((f: FieldConfig) => f.value === fieldName);
      if (field) return field;
    }
    return null;
  }, []);

  const getSectionFields = useCallback((sectionKey: keyof typeof targetFields) => {
    return targetFields[sectionKey];
  }, []);

  const handleSave = useCallback(async () => {
    // If period is yearly, open the modal instead of saving directly
    if (period === 'yearly') {
      setIsYearlyModalOpen(true);
      return;
    }

    try {
      await upsertWeeklyTarget({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: period,
        leads: calculatedValues.leads || 0,
        revenue: fieldValues.revenue || 0,
        avgJobSize: fieldValues.avgJobSize || 0,
        appointmentRate: fieldValues.appointmentRate || 0,
        showRate: fieldValues.showRate || 0,
        closeRate: fieldValues.closeRate || 0,
        adSpendBudget: calculatedValues.calculatedMonthlyBudget || 0,
        costPerLead: calculatedValues.cpl || 0,
        costPerEstimateSet: calculatedValues.cpEstimateSet || 0,
        costPerJobBooked: calculatedValues.cpJobBooked || 0,
      });

      toast({
        title: "✅ Targets Saved Successfully!",
        description: `Your ${period} target values have been updated.`,
      });
    } catch (err) {
      toast({
        title: "❌ Error Saving Targets",
        description: error || "Failed to save targets. Please try again.",
        variant: "destructive",
      });
    }
  }, [upsertWeeklyTarget, selectedStartDate, selectedEndDate, period, calculatedValues, fieldValues, toast, error]);

  const handleDatePeriodChange = useCallback((date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
    setLastChanged(null);
  }, []);

  const handleSaveMonthlyTargets = useCallback(async (monthlyData: { [key: string]: any }) => {
    try {
      // Here you would implement the logic to save monthly targets
      // For now, we'll just show a success message
      console.log('Monthly targets data:', monthlyData);
      
      toast({
        title: "✅ Monthly Targets Saved Successfully!",
        description: "Your yearly targets have been distributed across months.",
      });
      
      setIsYearlyModalOpen(false);
    } catch (err) {
      toast({
        title: "❌ Error Saving Monthly Targets",
        description: "Failed to save monthly targets. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
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

        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Targets"
            onButtonClick={handleSave}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <TargetSection
            sectionKey="funnelRate"
            title="Funnel Rates"
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-blue-50/50 to-purple-50/50"
            fields={getSectionFields('funnelRate')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
          />

          <TargetSection
            sectionKey="budget"
            title="Monthly Targets"
            icon={<Calculator className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-green-50/50 to-blue-50/50"
            fields={getSectionFields('budget')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
          />

          <TargetSection
            sectionKey="budgetTarget"
            title="Budget Targets"
            icon={<DollarSign className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-emerald-50/50 to-teal-50/50"
            fields={getSectionFields('budgetTarget')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Yearly Target Modal */}
      <YearlyTargetModal
        isOpen={isYearlyModalOpen}
        onOpenChange={setIsYearlyModalOpen}
        annualFieldValues={fieldValues}
        onSave={handleSaveMonthlyTargets}
        isLoading={isLoading}
      />
    </div>
  );
};