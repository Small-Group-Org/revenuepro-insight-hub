import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";
import { DatePeriodSelector } from '../components/DatePeriodSelector';
import { TargetSection } from '../components/TargetSection';
import { YearlyTargetModal } from '../components/YearlyTargetModal';
import { useTargetStore } from "../stores/targetStore";
import { useUserStore } from "../stores/userStore";
import useAuthStore from "../stores/authStore";
import { endOfWeek, startOfWeek, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { calculateFields, targetValidation } from "@/utils/page-utils/targetUtils";
import { getDaysInMonth } from "@/utils/page-utils/commonUtils";
import { handleInputDisable } from "@/utils/page-utils/compareUtils";
import { months, targetFields } from "@/utils/constant";
import { DisableMetadata } from "@/types";
import { FieldConfig, FieldValue, InputField, PeriodType } from "@/types";
import type { MonthlyData } from "../components/YearlyTargetModal";
import { getDefaultValues, processTargetData } from "@/utils/page-utils/targetUtils";
import { IWeeklyTarget, upsertTarget } from "@/service/targetService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  
  // New state for confirmation modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{ date: Date; period: PeriodType } | null>(null);
  
  // New state for priority conflict confirmation modal
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  const { upsertWeeklyTarget, isLoading, error, getTargetsForUser, currentTarget } = useTargetStore();
  const selectedYear = selectedDate.getFullYear();
  const { selectedUserId } = useUserStore();
  const { user } = useAuthStore();

  const calculatedValues = useMemo(() => 
    calculateFields(fieldValues, period, daysInMonth),
    [fieldValues, daysInMonth, period]
  );

  const disableLogic = useMemo(() => 
    handleInputDisable(period, selectedDate, currentTarget, 'setTargets'), 
    [period, selectedDate, currentTarget]
  );

  const [disableStatus, setDisableStatus] = useState(disableLogic);

  const getInputFieldNames = useCallback(() => {
    const inputNames: string[] = [];
    Object.values(targetFields).forEach(section => {
      section.forEach(field => {
        if (field.fieldType === 'input') {
          inputNames.push(field.value);
        }
      });
    });
    return inputNames;
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    // Don't detect unsaved changes when priority modal is open (we're in the process of saving)
    if (showPriorityModal) {
      return false;
    }
    
    if (!currentTarget) return false;
    
    const currentValues = processTargetData(currentTarget);
    const inputFieldNames = getInputFieldNames();
    
    return inputFieldNames.some(fieldName => {
      const currentValue = currentValues[fieldName] || 0;
      const newValue = fieldValues[fieldName] || 0;
      return Math.abs(currentValue - newValue) > 0.01; // Small tolerance for floating point
    });
  }, [currentTarget, fieldValues, getInputFieldNames, showPriorityModal]);

  // Check for priority conflicts
  const getPriorityConflict = useCallback((newPeriod: PeriodType) => {
    if (!currentTarget) return null;
    
    const priorityOrder = { yearly: 3, monthly: 2, weekly: 1 };
    const newPriority = priorityOrder[newPeriod as keyof typeof priorityOrder];
    
    // Get unique query types from current target
    const queryTypes = getUniqueQueryTypes(currentTarget);
    
    for (const queryType of queryTypes) {
      const existingPriority = priorityOrder[queryType as keyof typeof priorityOrder];
      if (existingPriority > newPriority) {
        const monthName = format(selectedDate, 'MMMM');
        return {
          existingType: queryType,
          newType: newPeriod,
          monthName: monthName,
          message: `The target for ${monthName} is already set in ${queryType} basis. Are you sure you want to update the target?`
        };
      }
    }
    
    return null;
  }, [currentTarget, selectedDate]);

  // Helper function to get unique query types
  const getUniqueQueryTypes = useCallback((target: any[] | null): string[] => {
    if (!target || target.length === 0) return [];
    
    let allTargetData: any[] = [];
    
    if (target.length === 12 && Array.isArray(target[0])) {
      target.forEach(monthData => {
        if (Array.isArray(monthData)) {
          allTargetData = allTargetData.concat(monthData);
        }
      });
    } else {
      allTargetData = target;
    }
    
    const queryTypes = allTargetData
      .map((t) => t.queryType)
      .filter((queryType) => queryType && queryType.trim() !== "");
    return [...new Set(queryTypes)];
  }, []);

  useEffect(() => {
    setDaysInMonth(getDaysInMonth(selectedDate));
  }, [selectedDate]);

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

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    setSelectedStartDate(formattedStartDate);
    setSelectedEndDate(formattedEndDate);

    if (user) {
      getTargetsForUser(period, formattedStartDate, formattedEndDate);
    }
  }, [selectedDate, period, user, selectedUserId]);

  useEffect(() => {
    setPrevValues(calculatedValues);
  }, []);

  useEffect(() => {
    if (currentTarget) {
      const newValues = processTargetData(currentTarget);
      setFieldValues(newValues);
      setLastChanged(null); 
      setPrevValues(newValues);
    }
  }, [currentTarget, period]); 

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

  const handleDatePeriodChange = useCallback((date: Date, period: PeriodType) => {
    // Navigation is now handled by onNavigationAttempt prop
    // This function is called only when navigation is allowed
    setSelectedDate(date);
    setPeriod(period);
    setLastChanged(null);
  }, []);

  const handleConfirmDateChange = useCallback(() => {
    if (pendingDateChange) {
      setSelectedDate(pendingDateChange.date);
      setPeriod(pendingDateChange.period);
      setLastChanged(null);
      setPendingDateChange(null);
    }
    setShowUnsavedModal(false);
  }, [pendingDateChange]);

  const handleCancelDateChange = useCallback(() => {
    setPendingDateChange(null);
    setShowUnsavedModal(false);
  }, []);

  const handleNavigationAttempt = useCallback((newDate: Date, newPeriod: PeriodType) => {
    // Don't show unsaved changes modal if priority modal is open (we're in the process of saving)
    if (showPriorityModal) {
      return true; // Allow navigation when priority modal is open
    }
    
    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      setPendingDateChange({ date: newDate, period: newPeriod });
      setShowUnsavedModal(true);
      return false; // Block navigation
    }
    
    // No unsaved changes, allow navigation
    return true;
  }, [hasUnsavedChanges, showPriorityModal]);

  const handleDisableStatusChange = useCallback((status: DisableMetadata) => {
    setDisableStatus(status);
  }, []);

  const handleSave = useCallback(async () => {
    const inputFieldNames = getInputFieldNames();
    const zeroFields = targetValidation(inputFieldNames, fieldValues);

    if (zeroFields.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <div>
            <div>The following fields cannot be 0:</div>
            <div><em>{zeroFields.join(', ')}</em></div>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    // Check for priority conflicts
    const priorityConflict = getPriorityConflict(period);
    if (priorityConflict) {
      // Store the save data and show confirmation modal
      const inputData: { [key: string]: number | undefined } = {};
      inputFieldNames.forEach(name => {
        inputData[name] = fieldValues[name];
      });

      const saveData = {
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: period,
        ...inputData
      };

      setPendingSaveData(saveData);
      setShowPriorityModal(true);
      return;
    }

    // No priority conflict, proceed with save
    await performSave();
  }, [upsertWeeklyTarget, selectedStartDate, selectedEndDate, period, fieldValues, toast, error, getInputFieldNames, getPriorityConflict]);

  const performSave = useCallback(async () => {
    if (period === 'yearly') {
      setIsYearlyModalOpen(true);
      return;
    }

    try {
      const inputFieldNames = getInputFieldNames();
      const inputData: { [key: string]: number | undefined } = {};
      inputFieldNames.forEach(name => {
        inputData[name] = fieldValues[name];
      });

      await upsertWeeklyTarget({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: period,
        ...inputData
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
  }, [upsertWeeklyTarget, selectedStartDate, selectedEndDate, period, fieldValues, toast, error, getInputFieldNames]);

  const handleCancelPrioritySave = useCallback(() => {
    setShowPriorityModal(false);
    setPendingSaveData(null);
  }, []);

  const performSaveMonthlyTargets = useCallback(async (monthlyData: { [key: string]: MonthlyData }) => {
    const inputFieldNames = getInputFieldNames();
    const userId = useUserStore.getState().selectedUserId;

    try {
      const targets: any[] = [];
      
      Object.entries(monthlyData).forEach(([month, data]) => {
        const monthIndex = months.indexOf(month);
        if (monthIndex === -1) return;
        
        const startDate = new Date(selectedYear, monthIndex, 1);
        const endDate = new Date(selectedYear, monthIndex + 1, 0);
        
        const targetData: any = {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          queryType: 'yearly',
          appointmentRate: fieldValues?.appointmentRate,
          avgJobSize: fieldValues?.avgJobSize,
          closeRate: fieldValues?.closeRate,
          com: fieldValues?.com,
          showRate: fieldValues?.showRate,
          userId,
        };

        inputFieldNames.forEach(name => {
          if (data[name as keyof MonthlyData] !== undefined) {
            targetData[name] = data[name as keyof MonthlyData];
          }
        });
        
        targets.push(targetData);
      });
      
      await upsertTarget(targets);
      
      toast({
        title: "Monthly Targets Saved Successfully!",
        description: "Your yearly targets have been distributed across months.",
      });
      
      setIsYearlyModalOpen(false);
    } catch (err) {
      toast({
        title: "Error Saving Monthly Targets",
        description: error || "Failed to save monthly targets. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, error, getInputFieldNames, selectedYear, fieldValues]);

  const handleConfirmPrioritySave = useCallback(async () => {
    setShowPriorityModal(false);
    if (pendingSaveData) {
      try {
        if (pendingSaveData.monthlyData) {
          // Handle yearly target save
          await performSaveMonthlyTargets(pendingSaveData.monthlyData);
        } else {
          // Handle regular target save
          await upsertWeeklyTarget(pendingSaveData);
          toast({
            title: "✅ Targets Saved Successfully!",
            description: `Your ${period} target values have been updated.`,
          });
        }
        setPendingSaveData(null);
      } catch (err) {
        toast({
          title: "❌ Error Saving Targets",
          description: error || "Failed to save targets. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [upsertWeeklyTarget, pendingSaveData, period, toast, error, performSaveMonthlyTargets]);

  const handleSaveMonthlyTargets = useCallback(async (monthlyData: { [key: string]: MonthlyData }) => {
    const inputFieldNames = getInputFieldNames();
    const userId = useUserStore.getState().selectedUserId;

    // Check for priority conflicts for yearly targets
    const priorityConflict = getPriorityConflict('yearly');
    if (priorityConflict) {
      // Store the monthly data and show confirmation modal
      setPendingSaveData({ monthlyData, userId, selectedYear, fieldValues });
      setShowPriorityModal(true);
      return;
    }

    // No priority conflict, proceed with save
    await performSaveMonthlyTargets(monthlyData);
  }, [toast, error, getInputFieldNames, selectedYear, fieldValues, getPriorityConflict, performSaveMonthlyTargets]);

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
            disableLogic={disableLogic}
            onDisableStatusChange={handleDisableStatusChange}
            onNavigationAttempt={handleNavigationAttempt}
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
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={disableStatus.shouldDisableNonRevenueFields}
          />

          <TargetSection
            sectionKey="budget"
            title={`${period.charAt(0).toUpperCase() + period.slice(1)} Targets`}
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
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={disableStatus.shouldDisableNonRevenueFields}
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
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={disableStatus.shouldDisableNonRevenueFields}
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
        selectedYear={selectedYear}
        apiData={currentTarget}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <AlertDialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Target is not saved, the values will be discarded. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDateChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDateChange}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Priority Conflict Confirmation Modal */}
      <AlertDialog open={showPriorityModal} onOpenChange={setShowPriorityModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Priority Conflict</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const priorityConflict = pendingSaveData?.monthlyData ? 
                  getPriorityConflict('yearly') : 
                  getPriorityConflict(period);
                return priorityConflict?.message || '';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPrioritySave}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPrioritySave}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};