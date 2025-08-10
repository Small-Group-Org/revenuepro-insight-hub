import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const LeadSheet = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  
  const { leads, loading, error, fetchLeads, updateLeadData, updateLeadLocal } = useLeadStore();
  const { selectedUserId } = useUserStore();

  // ULR options - moved outside component to prevent recreation
  const ULR_OPTIONS = [
    'Bad Phone Number',
    'Out of Area',
    'Job Too Small',
    'Said Didn\'t Fill Out Form',
    'No Longer Interested',
    'Service we don\'t offer',
    'Never responded',
    'In contact, estimate not yet set',
  ];

  // Helper function to get date range based on selected date and period
  const getDateRange = useCallback((date: Date, periodType: PeriodType) => {
    let startDate: string, endDate: string;

    if (periodType === 'weekly') {
      const weekInfo = getWeekInfo(date);
      startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
      endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');
    } else if (periodType === 'monthly') {
      startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      endDate = format(endOfMonth(date), 'yyyy-MM-dd');
    } else {
      startDate = format(startOfYear(date), 'yyyy-MM-dd');
      endDate = format(endOfYear(date), 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  }, []);

  // Fetch leads when selectedUserId, selectedDate, or period changes
  useEffect(() => {
    if (selectedUserId) {
      const { startDate, endDate } = getDateRange(selectedDate, period);
      fetchLeads(selectedUserId, startDate, endDate);
    }
  }, [selectedUserId, selectedDate, period, fetchLeads, getDateRange]);

  useEffect(() => {
    if (error) {
      toast({
        title: "❌ Error Loading Leads",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDatePeriodChange = useCallback((date: Date, periodType: PeriodType) => {
    setSelectedDate(date);
    setPeriod(periodType);
    // Leads will be fetched automatically via useEffect
  }, []);

  const handleEstimateSetChange = useCallback(async (leadId: string, checked: boolean) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (checked) {
      // Setting estimate to true - update immediately
      const result = await updateLeadData({
        _id: leadId,
        estimateSet: true,
        unqualifiedLeadReason: undefined
      });
      
      if (result.error) {
        toast({
          title: "❌ Error Updating Lead",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Lead Updated",
          description: "Estimate has been set for this lead.",
        });
      }
    } else {
      // Unchecking estimate - user must select ULR first
      updateLeadLocal(leadId, { estimateSet: false });
      setPendingULRLeadId(leadId);
      
      toast({
        title: "ℹ️ Select Unqualified Reason",
        description: "Please select a reason from the dropdown to complete this action.",
      });
    }
  }, [leads, updateLeadData, updateLeadLocal, toast]);

  const handleULRChange = useCallback(async (leadId: string, value: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (value === 'custom') {
      // Show custom input for this lead with current value pre-filled only if it's a custom reason
      setShowCustomInput(leadId);
      const currentReason = lead.unqualifiedLeadReason || '';
      const isCustomReason = currentReason && !ULR_OPTIONS.includes(currentReason);
      setCustomULR(isCustomReason ? currentReason : '');
      return;
    }

    // Update the lead with the selected ULR
    const result = await updateLeadData({
      _id: leadId,
      estimateSet: false,
      unqualifiedLeadReason: value
    });
    
    if (result.error) {
      toast({
        title: "❌ Error Updating Lead",
        description: result.message,
        variant: "destructive",
      });
      // Revert the estimate set change if update failed
      updateLeadLocal(leadId, { estimateSet: true });
    } else {
      toast({
        title: "✅ Lead Updated",
        description: "Unqualified lead reason has been set.",
      });
    }
    
    // Clear pending state
    setPendingULRLeadId(null);
    setShowCustomInput(null);
  }, [leads, updateLeadData, updateLeadLocal, toast]);

  const handleCustomULRSubmit = useCallback(async (leadId: string) => {
    if (!customULR.trim()) {
      toast({
        title: "❌ Invalid Input",
        description: "Please enter a custom reason.",
        variant: "destructive",
      });
      return;
    }

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Update the lead with the custom ULR
    const result = await updateLeadData({
      _id: leadId,
      estimateSet: false,
      unqualifiedLeadReason: customULR.trim()
    });
    
    if (result.error) {
      toast({
        title: "❌ Error Updating Lead",
        description: result.message,
        variant: "destructive",
      });
      // Revert the estimate set change if update failed
      updateLeadLocal(leadId, { estimateSet: true });
    } else {
      toast({
        title: "✅ Lead Updated",
        description: "Custom unqualified lead reason has been set.",
      });
    }
    
    // Clear states
    setPendingULRLeadId(null);
    setShowCustomInput(null);
    setCustomULR('');
  }, [customULR, leads, updateLeadData, updateLeadLocal, toast]);

  // Remove the save handler as updates are now automatic

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4 ">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Lead Sheet
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Track and manage your leads with detailed information and estimate status
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            allowedPeriods={['weekly', 'monthly', 'yearly']}
          />
        </div>

        <div className="w-full">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Lead Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto relative">
                <Table className="w-full min-w-[1400px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 w-32 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-1">
                          Estimate Set
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-48 sticky left-32 bg-gray-50 z-10 border-r border-gray-200 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-1">
                          Unqualified Lead Reason
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-32">
                        <div className="flex items-center gap-1">
                          Lead Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-40">
                        <div className="flex items-center gap-1">
                          Name
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-48">
                        <div className="flex items-center gap-1">
                          Email
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-36">
                        <div className="flex items-center gap-1">
                          Phone
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-20">
                        <div className="flex items-center gap-1">
                          Zip
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-32">
                        <div className="flex items-center gap-1">
                          Service
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-48">
                        <div className="flex items-center gap-1">
                          Ad Set Name
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-48">
                        <div className="flex items-center gap-1">
                          Ad Name
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(loading ? [] : leads).map((lead) => (
                      <TableRow key={lead.id} className={`hover:bg-gray-50 ${lead.estimateSet ? 'bg-green-50' : ''}`}>
                        <TableCell className={`px-3 py-4 text-center sticky left-0 z-10 border-r border-gray-200 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] ${lead.estimateSet ? 'bg-green-50' : 'bg-white'}`}>
                          <Checkbox
                            checked={lead.estimateSet}
                            onCheckedChange={(checked) => 
                              handleEstimateSetChange(lead.id, checked as boolean)
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </TableCell>
                        <TableCell className={`px-3 py-4 sticky left-32 z-10 border-r border-gray-200 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] text-center ${lead.estimateSet ? 'bg-green-50' : pendingULRLeadId === lead.id ? 'bg-yellow-50' : 'bg-white'}`}>
                          {lead.estimateSet ? (
                            <span className="text-gray-500 text-sm">NA</span>
                          ) : showCustomInput === lead.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={customULR}
                                onChange={(e) => setCustomULR(e.target.value)}
                                placeholder="Enter custom reason..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomULRSubmit(lead.id)}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleCustomULRSubmit(lead.id)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCustomInput(null);
                                    setCustomULR('');
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Select
                              value={lead.unqualifiedLeadReason || ''}
                              onValueChange={(value) => handleULRChange(lead.id, value)}
                            >
                              <SelectTrigger 
                                className={`w-full h-8 text-xs border-0 shadow-none ${pendingULRLeadId === lead.id ? 'ring-2 ring-yellow-200 bg-yellow-50' : 'hover:bg-gray-50'}`}
                                title={lead.unqualifiedLeadReason || "Select unqualified lead reason"}
                              >
                                <SelectValue placeholder={pendingULRLeadId === lead.id ? "Select reason required!" : "Select reason..."}>
                                  {lead.unqualifiedLeadReason && !ULR_OPTIONS.includes(lead.unqualifiedLeadReason) ? (
                                    <span className="text-blue-600 font-medium">"{lead.unqualifiedLeadReason}"</span>
                                  ) : (
                                    lead.unqualifiedLeadReason
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {ULR_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option} className="text-xs">
                                    {option}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom" className="text-xs font-medium text-blue-600">
                                  + Add Custom Reason
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="font-medium px-3 py-4">
                          {formatDate(lead.leadDate)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 px-3 py-4">
                          {lead.name}
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <a 
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {lead.email}
                          </a>
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <a 
                            href={`tel:${lead.phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {lead.phone}
                          </a>
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          {lead.zip}
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lead.service}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-4 text-xs">
                          {lead.adSetName}
                        </TableCell>
                        <TableCell className="px-3 py-4 text-xs">
                          {lead.adName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                  <p>Loading leads...</p>
                </div>
              )}
              
              {!loading && leads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No leads found for the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 