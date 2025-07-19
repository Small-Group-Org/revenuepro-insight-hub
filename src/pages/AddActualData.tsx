
import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Edit, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { TargetSection } from '@/components/TargetSection';
import { PeriodType, FieldValue } from '@/types';
import { reportingFields } from '@/utils/constant';
import { calculateReportingFields, calculateAddActualDataDisableLogic } from '@/utils/utils';

export const AddActualData = () => {
  const { actualData, addActualData } = useData();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');
  
  const [fieldValues, setFieldValues] = useState<FieldValue>({});
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});

  // Get the selected week string for data lookup
  const selectedWeek = format(selectedDate, 'yyyy-MM-dd');

  // Calculate all reporting fields
  const calculatedValues = useMemo(() => 
    calculateReportingFields(fieldValues), 
    [fieldValues]
  );

  // Calculate disable logic for AddActualData page
  const { isDisabled, disabledMessage, isButtonDisabled } = useMemo(() => 
    calculateAddActualDataDisableLogic(period, selectedDate), 
    [period, selectedDate]
  );

  // Load existing data when week changes
  React.useEffect(() => {
    const existingData = actualData.find(data => data.week === selectedWeek);
    if (existingData) {
      setFieldValues({
        testingBudgetSpent: 0, // Map from existing fields or use defaults
        awarenessBrandingBudgetSpent: 0,
        leadGenerationBudgetSpent: 0,
        revenue: 0,
        jobsBooked: existingData.jobsBooked || 0,
        estimatesSent: 0,
        estimatesSet: 0,
        budget: 0,
        notes: 0 // Store as number for FieldValue type
      });
    } else {
      setFieldValues({
        testingBudgetSpent: 0,
        awarenessBrandingBudgetSpent: 0,
        leadGenerationBudgetSpent: 0,
        revenue: 0,
        jobsBooked: 0,
        estimatesSent: 0,
        estimatesSet: 0,
        budget: 0,
        notes: 0
      });
    }
  }, [selectedWeek, actualData]);

  const handleInputChange = useCallback((fieldName: string, value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      value = 0;
    }
    
    const validatedValue = Math.max(0, value);
    
    setLastChanged(fieldName);
    setPrevValues(calculatedValues);
    
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: validatedValue
    }));
  }, [calculatedValues]);

  const handleSave = useCallback(() => {
    const dataToSave = {
      week: selectedWeek,
      leads: 0,
      appointmentsSet: 0,
      appointmentsComplete: 0,
      jobsBooked: fieldValues.jobsBooked || 0,
      salesRevenue: fieldValues.revenue || 0,
      metaBudgetSpent: calculatedValues.budgetSpent || 0,
      notes: fieldValues.notes ? String(fieldValues.notes) : '',
      // Add new reporting fields
      testingBudgetSpent: fieldValues.testingBudgetSpent || 0,
      awarenessBrandingBudgetSpent: fieldValues.awarenessBrandingBudgetSpent || 0,
      leadGenerationBudgetSpent: fieldValues.leadGenerationBudgetSpent || 0,
      revenue: fieldValues.revenue || 0,
      estimatesSent: fieldValues.estimatesSent || 0,
      estimatesSet: fieldValues.estimatesSet || 0,
      budget: fieldValues.budget || 0,
      budgetSpent: calculatedValues.budgetSpent || 0,
      overUnderBudget: calculatedValues.overUnderBudget || 0
    };
    
    addActualData(dataToSave);
    toast({
      title: "✅ Data Saved Successfully!",
      description: `Week of ${format(new Date(selectedWeek), 'MMM dd, yyyy')} has been updated.`,
    });
  }, [selectedWeek, fieldValues, calculatedValues, addActualData, toast]);

  const getWeekRange = (mondayDate: string) => {
    const monday = new Date(mondayDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${format(monday, 'MMM dd')} - ${format(sunday, 'MMM dd, yyyy')}`;
  };

  const isExistingData = actualData.some(data => data.week === selectedWeek);

  const isHighlighted = useCallback((fieldName: string) => {
    if (!lastChanged) return false;
    return prevValues[fieldName] !== calculatedValues[fieldName];
  }, [lastChanged, prevValues, calculatedValues]);

  const handleDatePeriodChange = useCallback((date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
  }, []);

  const getSectionFields = useCallback((sectionKey: keyof typeof reportingFields) => {
    return reportingFields[sectionKey];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Add Actual Performance Data
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Enter your weekly performance metrics for tracking and analysis
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Data"
            onButtonClick={handleSave}
            allowedPeriods={['weekly']}
            isButtonDisabled={isButtonDisabled}
          />
        </div>

        {/* Reporting Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <TargetSection
            sectionKey="budgetReport"
            title="Budget Report"
            icon={<DollarSign className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-blue-50/50 to-purple-50/50"
            fields={getSectionFields('budgetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
          />

          <TargetSection
            sectionKey="targetReport"
            title="Target Report"
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-green-50/50 to-blue-50/50"
            fields={getSectionFields('targetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
          />
        </div>
      </div>
    </div>
  );
};
