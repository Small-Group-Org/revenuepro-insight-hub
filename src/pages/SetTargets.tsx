import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Calculator,
  DollarSign,
  Target,
} from "lucide-react";
import { DatePeriodSelector } from "../components/DatePeriodSelector";
import { TargetSection } from "../components/TargetSection";
import { YearlyTargetModal } from "../components/YearlyTargetModal";
import { useTargetStore } from "../stores/targetStore";
import { useUserStore } from "../stores/userStore";
import useAuthStore from "../stores/authStore";
import {
  endOfWeek,
  startOfWeek,
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  calculateFields,
  targetValidation,
} from "@/utils/page-utils/targetUtils";
import {
  calculateManagementCost,
  getDaysInMonth,
} from "@/utils/page-utils/commonUtils";
import { handleInputDisable } from "@/utils/page-utils/compareUtils";
import { months, targetFields } from "@/utils/constant";
import { DisableMetadata } from "@/types";
import { FieldConfig, FieldValue, InputField, PeriodType } from "@/types";
import type { MonthlyData } from "../components/YearlyTargetModal";
import {
  getDefaultValues,
  processTargetData,
} from "@/utils/page-utils/targetUtils";
import { upsertTarget } from "@/service/targetService";
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
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useCombinedLoading } from "@/hooks/useCombinedLoading";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent } from "@/components/ui/card";

export const SetTargets = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();

  const [fieldValues, setFieldValues] = useState<FieldValue>(
    getDefaultValues()
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(new Date()));
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);
  const [createYearlyTarget, setCreateYearlyTarget] = useState(false);

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  const { upsertWeeklyTarget, error, getTargetsForUser, currentTarget } =
    useTargetStore();
  const { isLoading } = useCombinedLoading();
  const selectedYear = selectedDate.getFullYear();
  const { selectedUserId } = useUserStore();
  const { user } = useAuthStore();

  const calculatedValues = useMemo(
    () => calculateFields(fieldValues, period, daysInMonth),
    [fieldValues, daysInMonth, period]
  );

  const disableLogic = useMemo(
    () =>
      handleInputDisable(
        period,
        selectedDate,
        currentTarget,
        "setTargets",
        userRole
      ),
    [period, selectedDate, currentTarget]
  );

  const [disableStatus, setDisableStatus] = useState(disableLogic);

  const getInputFieldNames = useCallback(() => {
    const inputNames: string[] = [];
    Object.values(targetFields).forEach((section) => {
      section.forEach((field) => {
        if (field.fieldType === "input") {
          // Exclude managementCost for weekly periods
          if (period === "weekly" && field.value === "managementCost") {
            return;
          }
          inputNames.push(field.value);
        }
      });
    });
    return inputNames;
  }, [period]);

  const getPriorityConflict = useCallback(
    (newPeriod: PeriodType) => {
      if (!currentTarget) return null;

      const priorityOrder = { yearly: 3, monthly: 2, weekly: 1 };
      const newPriority =
        priorityOrder[newPeriod as keyof typeof priorityOrder];

      // Get unique query types from current target
      const queryTypes = getUniqueQueryTypes(currentTarget);

      for (const queryType of queryTypes) {
        const existingPriority =
          priorityOrder[queryType as keyof typeof priorityOrder];
        if (existingPriority > newPriority) {
          const monthName = format(selectedDate, "MMMM");
          return {
            existingType: queryType,
            newType: newPeriod,
            monthName: monthName,
            message: `The target for ${monthName} is already set in ${queryType} basis. Are you sure you want to update the target?`,
          };
        }
      }

      return null;
    },
    [currentTarget, selectedDate]
  );

  // Helper function to get unique query types
  const getUniqueQueryTypes = useCallback((target: any[] | null): string[] => {
    if (!target || target.length === 0) return [];

    let allTargetData: any[] = [];

    if (target.length === 12 && Array.isArray(target[0])) {
      target.forEach((monthData) => {
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

    if (period === "weekly") {
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
    } else if (period === "monthly") {
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else {
      startDate = startOfYear(selectedDate);
      endDate = endOfYear(selectedDate);
    }

    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");

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

  const isHighlighted = useCallback(
    (fieldName: string) => {
      if (!lastChanged) return false;
      return prevValues[fieldName] !== calculatedValues[fieldName];
    },
    [lastChanged, prevValues, calculatedValues]
  );

  const handleInputChange = useCallback(
    (fieldName: string, value: number) => {
      if (value === undefined || value === null || isNaN(value)) {
        value = 0;
      }

      const validatedValue = Math.max(0, value);

      setLastChanged(fieldName);
      setPrevValues(calculatedValues);

      const field = findFieldByName(fieldName);
      if (field && field.fieldType === "input") {
        const inputField = field as InputField;
        let finalValue = validatedValue;

        if (inputField.max !== undefined) {
          finalValue = Math.min(finalValue, inputField.max);
        }
        if (inputField.min !== undefined) {
          finalValue = Math.max(finalValue, inputField.min);
        }

        if (
          fieldName === "com" &&
          !fieldValues.managementCost &&
          fieldValues.revenue &&
          fieldValues.revenue > 0
        ) {
          const adBudget = (finalValue * fieldValues.revenue) / 100;
          const managementCost = calculateManagementCost(adBudget);

          setFieldValues((prev) => ({
            ...prev,
            [fieldName]: finalValue,
            managementCost: managementCost,
          }));
        } else {
          setFieldValues((prev) => ({
            ...prev,
            [fieldName]: finalValue,
          }));
        }
      }
    },
    [calculatedValues]
  );

  const findFieldByName = useCallback(
    (fieldName: string): FieldConfig | null => {
      for (const section of Object.values(targetFields)) {
        const field = section.find((f: FieldConfig) => f.value === fieldName);
        if (field) return field;
      }
      return null;
    },
    []
  );

  const getSectionFields = useCallback(
    (sectionKey: keyof typeof targetFields) => {
      return targetFields[sectionKey];
    },
    []
  );

  const handleDatePeriodChange = useCallback(
    (date: Date, period: PeriodType) => {
      setSelectedDate(date);
      setPeriod(period);
      setLastChanged(null);
      setCreateYearlyTarget(false);
    },
    []
  );

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
            <div>
              <em>{zeroFields.join(", ")}</em>
            </div>
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
      inputFieldNames.forEach((name) => {
        inputData[name] = fieldValues[name];
      });

      const saveData = {
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: period,
        ...inputData,
      };

      setPendingSaveData(saveData);
      setShowPriorityModal(true);
      return;
    }

    // No priority conflict, proceed with save
    await performSave();
  }, [
    upsertWeeklyTarget,
    selectedStartDate,
    selectedEndDate,
    period,
    fieldValues,
    toast,
    error,
    getInputFieldNames,
    getPriorityConflict,
  ]);

  const performSave = useCallback(async () => {
    if (period === "yearly") {
      setIsYearlyModalOpen(true);
      return;
    }

    try {
      const inputFieldNames = getInputFieldNames();
      const inputData: { [key: string]: number | undefined } = {};
      inputFieldNames.forEach((name) => {
        inputData[name] = fieldValues[name];
      });

      await upsertWeeklyTarget({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        queryType: period,
        ...inputData,
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
  }, [
    upsertWeeklyTarget,
    selectedStartDate,
    selectedEndDate,
    period,
    fieldValues,
    toast,
    error,
    getInputFieldNames,
  ]);

  const handleCancelPrioritySave = useCallback(() => {
    setShowPriorityModal(false);
    setPendingSaveData(null);
  }, []);

  const performSaveMonthlyTargets = useCallback(
    async (monthlyData: { [key: string]: MonthlyData }) => {
      const inputFieldNames = getInputFieldNames();
      const userId = useUserStore.getState().selectedUserId;

      try {
        const targets: any[] = [];
        const currentMonth = new Date().getMonth(); // 0-based month index

        Object.entries(monthlyData).forEach(([month, data]) => {
          const monthIndex = months.indexOf(month);
          if (monthIndex === -1) return;

          // Only include months that are after the current month until December
          if (monthIndex <= currentMonth) return;

          const startDate = new Date(selectedYear, monthIndex, 1);
          const endDate = new Date(selectedYear, monthIndex + 1, 0);

          const targetData: any = {
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            queryType: "yearly",
            appointmentRate: fieldValues?.appointmentRate,
            avgJobSize: fieldValues?.avgJobSize,
            closeRate: fieldValues?.closeRate,
            com: fieldValues?.com,
            showRate: fieldValues?.showRate,
            userId,
          };

          inputFieldNames.forEach((name) => {
            if (data[name as keyof MonthlyData] !== undefined) {
              targetData[name] = data[name as keyof MonthlyData];
            }
          });

          targets.push(targetData);
        });

        await upsertTarget(targets);
        // setCreateYearlyTarget(false);

        toast({
          title: "Monthly Targets Saved Successfully!",
          description:
            "Your yearly targets have been distributed across months.",
        });

        setIsYearlyModalOpen(false);
      } catch (err) {
        toast({
          title: "Error Saving Monthly Targets",
          description:
            error || "Failed to save monthly targets. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast, error, getInputFieldNames, selectedYear, fieldValues]
  );

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
  }, [
    upsertWeeklyTarget,
    pendingSaveData,
    period,
    toast,
    error,
    performSaveMonthlyTargets,
  ]);

  const resetYearlyTargets = () => {
    setFieldValues(getDefaultValues());
    setLastChanged(null);
    setPrevValues(getDefaultValues());
    setCreateYearlyTarget(true);

    toast({
      title: "✅ Targets Reset",
      description: "All yearly target values have been reset to default.",
    });
  };

  const viewYearlyTargets = () => {
    setCreateYearlyTarget(false);
    
    if (user) {
      getTargetsForUser(period, selectedStartDate, selectedEndDate);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 pt-4 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg  flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Set Targets
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10 mt-2">
              Configure your business targets and KPIs with precision
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-2">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Targets"
            onButtonClick={handleSave}
            disableLogic={disableLogic}
            onDisableStatusChange={handleDisableStatusChange}
            onNavigationAttempt={() => true} // Always allow navigation
          />
        </div>

        {period === "yearly" && (
          <div className="max-w-7xl mx-auto mb-6">
            <Card className="bg-gradient-to-br from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-lg hover:border-primary/10 transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {createYearlyTarget ? (
                      <p className="text-muted-foreground text-sm">
                        Please set the yearly targets from{" "}
                        <i>
                          {format(
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth() + 1,
                              1
                            ),
                            "MMMM yyyy"
                          )}
                        </i>{" "}
                        to <i>December {selectedYear}</i>. To view yearly aggregated targets, please click{" "}
                        <span
                          className="text-primary cursor-pointer underline"
                          onClick={viewYearlyTargets}
                        >
                          here
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Below yearly targets are aggregated for the whole year.
                        To create a new yearly targets from{" "}
                        <i>
                          {format(
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth() + 1,
                              1
                            ),
                            "MMMM yyyy"
                          )}
                        </i>{" "}
                        to <i>December {selectedYear}</i>, please click{" "}
                        <span
                          className="text-primary cursor-pointer underline"
                          onClick={resetYearlyTargets}
                        >
                          here
                        </span>
                        .
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <TargetSection
            sectionKey="funnelRate"
            title="Funnel Rates"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            gradientClass="bg-gradient-primary/10"
            fields={getSectionFields("funnelRate")}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={
              disableStatus.shouldDisableNonRevenueFields
            }
          />

          <TargetSection
            sectionKey="budget"
            title={`${
              period.charAt(0).toUpperCase() + period.slice(1)
            } Targets`}
            icon={<Calculator className="h-5 w-5 text-accent" />}
            gradientClass="bg-gradient-accent/10"
            fields={getSectionFields("budget")}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={
              disableStatus.shouldDisableNonRevenueFields
            }
          />

          <TargetSection
            sectionKey="budgetTarget"
            title="Budget Targets"
            icon={<DollarSign className="h-5 w-5 text-success" />}
            gradientClass="bg-gradient-secondary/10"
            fields={getSectionFields("budgetTarget")}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            isLoading={isLoading}
            period={period}
            selectedDate={selectedDate}
            isDisabled={disableStatus.isDisabled}
            disabledMessage={disableStatus.disabledMessage}
            shouldDisableNonRevenueFields={
              disableStatus.shouldDisableNonRevenueFields
            }
          />
        </div>
      </div>

      {/* Yearly Target Modal */}
      {isYearlyModalOpen && (
        <YearlyTargetModal
          isOpen={isYearlyModalOpen}
          onOpenChange={setIsYearlyModalOpen}
          type={createYearlyTarget ? "create" : "update"}
          annualFieldValues={fieldValues}
          onSave={performSaveMonthlyTargets}
          isLoading={isLoading}
          selectedYear={selectedYear}
          apiData={currentTarget}
        />
      )}

      {/* Priority Conflict Confirmation Modal */}
      <AlertDialog open={showPriorityModal} onOpenChange={setShowPriorityModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Priority Conflict</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const priorityConflict = pendingSaveData?.monthlyData
                  ? getPriorityConflict("yearly")
                  : getPriorityConflict(period);
                return priorityConflict?.message || "";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPrioritySave}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPrioritySave}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Screen Loader */}
      <FullScreenLoader isLoading={isLoading} message="Loading targets..." />
    </div>
  );
};
