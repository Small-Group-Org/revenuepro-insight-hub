
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, Target } from 'lucide-react';

export const SetTargets = () => {
  const { targets, updateTargets, resetTargets } = useData();
  const { toast } = useToast();
  const [formData, setFormData] = useState(targets);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = () => {
    updateTargets(formData);
    toast({
      title: "✅ Targets Saved Successfully!",
      description: "Your target values have been updated.",
    });
  };

  const handleReset = () => {
    const confirmed = window.confirm('Are you sure you want to reset all targets to default values?');
    if (confirmed) {
      resetTargets();
      setFormData(targets);
      toast({
        title: "🔄 Targets Reset",
        description: "All targets have been reset to default values.",
      });
    }
  };

  const targetFields = [
    { key: 'leads', label: 'Leads Target', icon: '👥' },
    { key: 'appointmentsSet', label: 'Appointments Set Target', icon: '📅' },
    { key: 'appointmentsComplete', label: 'Appointments Complete Target', icon: '✅' },
    { key: 'jobsBooked', label: 'Jobs Booked Target', icon: '🎯' },
    { key: 'salesRevenue', label: 'Sales Revenue Target ($)', icon: '💰' },
    { key: 'metaBudgetSpent', label: 'Meta Budget Spent Target ($)', icon: '📊' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Set Performance Targets</h1>
          <p className="text-slate-600 mt-1">Define your monthly performance goals and benchmarks</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline" className="hover:bg-red-50">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Targets
          </Button>
        </div>
      </div>

      {/* Targets Form */}
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
                {key === 'salesRevenue' || key === 'metaBudgetSpent' 
                  ? 'Enter target amount in dollars' 
                  : 'Enter target number of units'}
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
              />
              {(key === 'salesRevenue' || key === 'metaBudgetSpent') && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Target Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-900">Target Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {targetFields.map(({ key, label, icon }) => (
            <div key={key} className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg">{icon}</div>
              <div className="text-2xl font-bold text-slate-900">
                {key === 'salesRevenue' || key === 'metaBudgetSpent' 
                  ? `$${formData[key as keyof typeof formData].toLocaleString()}`
                  : formData[key as keyof typeof formData].toLocaleString()}
              </div>
              <div className="text-xs text-slate-600">{label.replace(' Target', '')}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Help Text */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 Tips for Setting Targets</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Base targets on historical performance and growth goals</li>
          <li>• Consider seasonal variations in your industry</li>
          <li>• Review and adjust targets quarterly based on results</li>
          <li>• Ensure targets are challenging but achievable</li>
        </ul>
      </Card>
    </div>
  );
};
