import React, { useState, useEffect } from 'react';
import { useEnhancedData, WeeklyTargets } from '@/contexts/EnhancedDataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { WeekCalendar } from '@/components/WeekCalendar';
import { Save, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getWeeksInMonth } from '@/utils/weekLogic';

type TargetLevel = 'yearly' | 'monthly' | 'weekly';

export const EnhancedSetTargets = () => {
  const {
    currentYear,
    currentMonth,
    currentWeek,
    setCurrentView,
    setYearlyTargets,
    setMonthlyTargets,
    setWeeklyTargets,
    getYearlyTargets,
    getMonthlyTargets,
    getWeeklyTargets,
  } = useEnhancedData();

  const { toast } = useToast();
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');
  const [targetLevel, setTargetLevel] = useState<TargetLevel>('weekly');
  const [formData, setFormData] = useState<WeeklyTargets>({
    leads: 0,
    appointmentsSet: 0,
    appointmentsComplete: 0,
    jobsBooked: 0,
    salesRevenue: 0,
    metaBudgetSpent: 0,
  });

  const [originalData, setOriginalData] = useState<WeeklyTargets | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    let currentTargets: WeeklyTargets | null = null;
    
    if (targetLevel === 'yearly') {
      currentTargets = getYearlyTargets(currentYear);
    } else if (targetLevel === 'monthly') {
      currentTargets = getMonthlyTargets(currentYear, currentMonth);
    } else {
      currentTargets = getWeeklyTargets(currentWeek.weekId);
    }
    
    if (currentTargets) {
      setFormData(currentTargets);
      setOriginalData(currentTargets);
    } else {
      const defaultTargets = {
        leads: 0,
        appointmentsSet: 0,
        appointmentsComplete: 0,
        jobsBooked: 0,
        salesRevenue: 0,
        metaBudgetSpent: 0,
      };
      setFormData(defaultTargets);
      setOriginalData(null);
    }
  }, [targetLevel, currentYear, currentMonth, currentWeek]);

  const handleInputChange = (field: keyof WeeklyTargets, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = () => {
    if (targetLevel === 'yearly') {
      setYearlyTargets(currentYear, formData);
      toast({
        title: "✅ Yearly Targets Saved!",
        description: `Targets for ${currentYear} have been set and distributed.`,
      });
    } else if (targetLevel === 'monthly') {
      setMonthlyTargets(currentYear, currentMonth, formData);
      toast({
        title: "✅ Monthly Targets Saved!",
        description: "Monthly targets have been updated.",
      });
    } else {
      setWeeklyTargets(currentWeek.weekId, formData);
      toast({
        title: "✅ Weekly Targets Saved!",
        description: "Weekly targets have been updated.",
      });
    }
    setOriginalData(formData);
  };

  const targetFields = [
    { key: 'leads', label: 'Leads Target', icon: '👥' },
    { key: 'appointmentsSet', label: 'Appointments Set Target', icon: '📅' },
    { key: 'appointmentsComplete', label: 'Appointments Complete Target', icon: '✅' },
    { key: 'jobsBooked', label: 'Jobs Booked Target', icon: '🎯' },
    { key: 'salesRevenue', label: 'Sales Revenue Target ($)', icon: '💰' },
    { key: 'metaBudgetSpent', label: 'Meta Budget Spent Target ($)', icon: '📊' },
  ];

  const hasChanges = originalData && JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Set Performance Targets</h1>
          <p className="text-muted-foreground mt-1">
            Set {targetLevel} targets with automatic proportional distribution
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-primary hover:bg-primary-light"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Targets
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Target Level</h3>
        </div>
        
        <div className="flex gap-2">
          {(['yearly', 'monthly', 'weekly'] as TargetLevel[]).map((level) => (
            <Button
              key={level}
              variant={targetLevel === level ? "default" : "outline"}
              onClick={() => setTargetLevel(level)}
              className="capitalize"
            >
              {level} Targets
            </Button>
          ))}
        </div>

        {targetLevel !== 'weekly' && (
          <Alert className="mt-4">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Setting {targetLevel} targets will automatically distribute them across sub-periods.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WeekCalendar
            selectedWeek={currentWeek}
            onWeekSelect={(week) => setCurrentView(week.belongsToYear, week.belongsToMonth, week)}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onViewChange={setCurrentView}
            view={view}
            onViewModeChange={setView}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-6">
            <Card className="p-6 bg-accent/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Setting {targetLevel.charAt(0).toUpperCase() + targetLevel.slice(1)} Targets
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {targetLevel === 'yearly' && `For year ${currentYear}`}
                    {targetLevel === 'monthly' && `For month ${currentMonth + 1}/${currentYear}`}
                    {targetLevel === 'weekly' && `For ${currentWeek.weekLabel}`}
                  </p>
                </div>
                {hasChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {targetFields.map(({ key, label, icon }) => (
                <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <Label htmlFor={key} className="text-lg font-semibold text-foreground">
                        {label}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input
                      id={key}
                      type="number"
                      value={formData[key as keyof WeeklyTargets]}
                      onChange={(e) => handleInputChange(key as keyof WeeklyTargets, e.target.value)}
                      className="text-lg font-medium"
                      placeholder="0"
                    />
                    {(key === 'salesRevenue' || key === 'metaBudgetSpent') && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};