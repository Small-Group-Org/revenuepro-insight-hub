import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { Lead } from '@/types';
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ULR options based on the image
  const ulrOptions = [
    'Bad Phone Number',
    'Out of Area',
    'Job Too Small',
    'Said Didn\'t Fill Out Form',
    'No Longer Interested',
    'Unresponsive'
  ];

  // Mock data for demonstration - replace with actual API call
  const mockLeads: Lead[] = [
    {
      id: '1',
      leadDate: '2024-01-15',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      zip: '12345',
      service: 'Roofing',
      adSetName: 'Winter Roofing Campaign',
      adName: 'Emergency Roof Repair',
      estimateSet: false,
      clientId: 'CLT001',
      unqualifiedLeadReason: 'Bad Phone Number',
    },
    {
      id: '2',
      leadDate: '2024-01-16',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 234-5678',
      zip: '23456',
      service: 'Siding',
      adSetName: 'Home Improvement',
      adName: 'Siding Replacement',
      estimateSet: true,
      clientId: 'CLT002',
      unqualifiedLeadReason: undefined, // Should show NA when estimate is set
    },
    {
      id: '3',
      leadDate: '2024-01-17',
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '(555) 345-6789',
      zip: '34567',
      service: 'Gutters',
      adSetName: 'Gutter Maintenance',
      adName: 'Gutter Cleaning Service',
      estimateSet: false,
      clientId: 'CLT003',
      unqualifiedLeadReason: 'Out of Area',
    },
    {
      id: '4',
      leadDate: '2024-01-18',
      name: 'Lisa Wilson',
      email: 'lisa.wilson@email.com',
      phone: '(555) 456-7890',
      zip: '45678',
      service: 'Windows',
      adSetName: 'Window Replacement',
      adName: 'Energy Efficient Windows',
      estimateSet: true,
      clientId: 'CLT004',
      unqualifiedLeadReason: undefined, // Should show NA when estimate is set
    },
    {
      id: '5',
      leadDate: '2024-01-19',
      name: 'Robert Brown',
      email: 'robert.brown@email.com',
      phone: '(555) 567-8901',
      zip: '56789',
      service: 'Roofing',
      adSetName: 'Summer Roofing',
      adName: 'Roof Inspection',
      estimateSet: false,
      clientId: 'CLT005',
      unqualifiedLeadReason: 'Job Too Small',
    },
  ];

  useEffect(() => {
    // Load leads data - replace with actual API call
    setLeads(mockLeads);
  }, []);

  const handleDatePeriodChange = (date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
    // Here you would typically fetch leads for the selected period
  };

  const handleEstimateSetChange = (leadId: string, checked: boolean) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { 
          ...lead, 
          estimateSet: checked,
          unqualifiedLeadReason: checked ? undefined : lead.unqualifiedLeadReason
        } : lead
      )
    );
  };

  const handleULRChange = (leadId: string, value: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, unqualifiedLeadReason: value } : lead
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would save the updated leads data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "✅ Leads Updated Successfully!",
        description: "Your lead data has been saved.",
      });
    } catch (error) {
      toast({
        title: "❌ Error Saving Leads",
        description: "Failed to save lead data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                    {leads.map((lead) => (
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
                        <TableCell className={`px-3 py-4 sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] text-center ${lead.estimateSet ? 'bg-green-50' : 'bg-white'}`}>
                          {lead.estimateSet ? (
                            <span className="text-gray-500 text-sm">NA</span>
                          ) : (
                            <Select
                              value={lead.unqualifiedLeadReason || ''}
                              onValueChange={(value) => handleULRChange(lead.id, value)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Select reason..." />
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
              
              {leads.length === 0 && (
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