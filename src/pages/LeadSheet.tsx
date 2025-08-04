import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { Lead } from '@/types';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  
  const { leads, loading, error, fetchLeads, updateLeadData, updateLeadLocal } = useLeadStore();
  const { selectedUserId } = useUserStore();

  // ULR options based on the image
  const ulrOptions = [
    'Bad Phone Number',
    'Out of Area',
    'Job Too Small',
    'Said Didn\'t Fill Out Form',
    'No Longer Interested',
    'Unresponsive'
  ];

  useEffect(() => {
    // Fetch leads when selectedUserId changes
    if (selectedUserId) {
      fetchLeads(selectedUserId);
    }
  }, [selectedUserId, fetchLeads]);

  useEffect(() => {
    if (error) {
      toast({
        title: "❌ Error Loading Leads",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDatePeriodChange = (date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
    // Here you would typically fetch leads for the selected period
  };

  const handleEstimateSetChange = async (leadId: string, checked: boolean) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (checked) {
      // Setting estimate to true - update immediately
      const result = await updateLeadData({
        clientId: lead.clientId,
        id: leadId,
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
  };

  const handleULRChange = async (leadId: string, value: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Update the lead with the selected ULR
    const result = await updateLeadData({
      clientId: lead.clientId,
      id: leadId,
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
  };

  // Remove the save handler as updates are now automatic

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

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
            allowedPeriods={['weekly', 'monthly']}
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
                      <TableHead className="font-semibold text-gray-700 w-32">
                        <div className="flex items-center gap-1">
                          Estimate Set
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 w-48 sticky right-0 bg-gray-50 z-10 border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] text-center">
                        <div className="flex items-center gap-1">
                          Unqualified Lead Reason
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(loading ? [] : leads).map((lead) => (
                      <TableRow key={lead.id} className={`hover:bg-gray-50 ${lead.estimateSet ? 'bg-green-50' : ''}`}>
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
                        <TableCell className="px-3 py-4 text-center">
                          <Checkbox
                            checked={lead.estimateSet}
                            onCheckedChange={(checked) => 
                              handleEstimateSetChange(lead.id, checked as boolean)
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </TableCell>
                        <TableCell className={`px-3 py-4 sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] text-center ${lead.estimateSet ? 'bg-green-50' : pendingULRLeadId === lead.id ? 'bg-yellow-50' : 'bg-white'}`}>
                          {lead.estimateSet ? (
                            <span className="text-gray-500 text-sm">NA</span>
                          ) : (
                            <Select
                              value={lead.unqualifiedLeadReason || ''}
                              onValueChange={(value) => handleULRChange(lead.id, value)}
                            >
                              <SelectTrigger className={`w-full h-8 text-xs ${pendingULRLeadId === lead.id ? 'border-yellow-400 ring-2 ring-yellow-200' : ''}`}>
                                <SelectValue placeholder={pendingULRLeadId === lead.id ? "Select reason required!" : "Select reason..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {ulrOptions.map((option) => (
                                  <SelectItem key={option} value={option} className="text-xs">
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
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