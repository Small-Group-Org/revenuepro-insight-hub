
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Save, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';

export const AddActualData = () => {
  const { actualData, addActualData } = useData();
  const { toast } = useToast();
  
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return format(monday, 'yyyy-MM-dd');
  });

  const [formData, setFormData] = useState({
    leads: 0,
    appointmentsSet: 0,
    appointmentsComplete: 0,
    jobsBooked: 0,
    salesRevenue: 0,
    metaBudgetSpent: 0,
    notes: ''
  });

  // Load existing data when week changes
  React.useEffect(() => {
    const existingData = actualData.find(data => data.week === selectedWeek);
    if (existingData) {
      setFormData({
        leads: existingData.leads,
        appointmentsSet: existingData.appointmentsSet,
        appointmentsComplete: existingData.appointmentsComplete,
        jobsBooked: existingData.jobsBooked,
        salesRevenue: existingData.salesRevenue,
        metaBudgetSpent: existingData.metaBudgetSpent,
        notes: existingData.notes || ''
      });
    } else {
      setFormData({
        leads: 0,
        appointmentsSet: 0,
        appointmentsComplete: 0,
        jobsBooked: 0,
        salesRevenue: 0,
        metaBudgetSpent: 0,
        notes: ''
      });
    }
  }, [selectedWeek, actualData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'notes' ? value : (parseFloat(value) || 0)
    }));
  };

  const handleSave = () => {
    const dataToSave = {
      week: selectedWeek,
      ...formData
    };
    
    addActualData(dataToSave);
    toast({
      title: "✅ Data Saved Successfully!",
      description: `Week of ${format(new Date(selectedWeek), 'MMM dd, yyyy')} has been updated.`,
    });
  };

  const getWeekRange = (mondayDate: string) => {
    const monday = new Date(mondayDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${format(monday, 'MMM dd')} - ${format(sunday, 'MMM dd, yyyy')}`;
  };

  const isExistingData = actualData.some(data => data.week === selectedWeek);

  const actualFields = [
    { key: 'leads', label: 'Leads Generated', icon: '👥', color: 'blue' },
    { key: 'appointmentsSet', label: 'Appointments Set', icon: '📅', color: 'green' },
    { key: 'appointmentsComplete', label: 'Appointments Completed', icon: '✅', color: 'emerald' },
    { key: 'jobsBooked', label: 'Jobs Booked', icon: '🎯', color: 'orange' },
    { key: 'salesRevenue', label: 'Sales Revenue ($)', icon: '💰', color: 'purple' },
    { key: 'metaBudgetSpent', label: 'Meta Budget Spent ($)', icon: '📊', color: 'red' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Actual Performance Data</h1>
          <p className="text-slate-600 mt-1">Enter your weekly performance metrics for tracking</p>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Save Data
        </Button>
      </div>

      {/* Week Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div className="flex-1">
            <Label htmlFor="week-select" className="text-lg font-semibold">
              Select Week (Monday - Sunday)
            </Label>
            <p className="text-sm text-slate-600 mt-1">
              Selected: {getWeekRange(selectedWeek)}
              {isExistingData && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Editing Existing Data
                </span>
              )}
            </p>
          </div>
          <Input
            id="week-select"
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Data Entry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {actualFields.map(({ key, label, icon, color }) => (
          <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <Label htmlFor={key} className="text-lg font-semibold text-slate-900">
                  {label}
                </Label>
              </div>
              <p className="text-sm text-slate-600">
                {key === 'salesRevenue' || key === 'metaBudgetSpent' 
                  ? 'Enter actual amount spent/earned' 
                  : 'Enter actual number achieved'}
              </p>
            </div>
            
            <div className="relative">
              <Input
                id={key}
                type="number"
                value={formData[key as keyof typeof formData] as number}
                onChange={(e) => handleInputChange(key as keyof typeof formData, e.target.value)}
                className="text-lg font-medium bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                placeholder="0"
              />
              {(key === 'salesRevenue' || key === 'metaBudgetSpent') && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Notes Section */}
      <Card className="p-6">
        <Label htmlFor="notes" className="text-lg font-semibold text-slate-900 mb-2 block">
          📝 Weekly Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Add any relevant notes about this week's performance, challenges, or observations..."
          className="min-h-24 bg-slate-50"
        />
      </Card>

      {/* Recent Entries */}
      {actualData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Recent Entries</h3>
          <div className="space-y-2">
            {actualData
              .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
              .slice(0, 5)
              .map((data) => (
                <div key={data.week} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium">{getWeekRange(data.week)}</span>
                    <span className="ml-3 text-sm text-slate-600">
                      {data.leads} leads, {data.appointmentsSet} appointments, ${data.salesRevenue.toLocaleString()} revenue
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeek(data.week)}
                    className="hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
