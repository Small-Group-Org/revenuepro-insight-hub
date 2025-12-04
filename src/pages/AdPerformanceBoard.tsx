// AdPerformanceBoard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BoardRow {
  campaignName?: string;
  adSetName?: string;
  adName?: string;
  numberOfLeads?: number;
  numberOfEstimateSets?: number;
  numberOfJobsBooked?: number;
  numberOfUnqualifiedLeads?: number;
  costPerLead?: number | null;
  costPerEstimateSet?: number | null;
  costPerJobBooked?: number | null;
  costOfMarketingPercent?: number | null;
}

interface BoardFilters {
  startDate: string;
  endDate: string;
  campaignName?: string[];
  adSetName?: string[];
  adName?: string[];
  estimateSetLeads?: boolean;
  jobBookedLeads?: boolean;
  zipCode?: string[];
  serviceType?: string[];
  leadScore?: { min?: number; max?: number };
}

interface BoardColumns {
  campaignName: boolean;
  adSetName: boolean;
  adName: boolean;
  numberOfLeads: boolean;
  numberOfEstimateSets: boolean;
  numberOfJobsBooked: boolean;
  numberOfUnqualifiedLeads: boolean;
  costPerLead: boolean;
  costPerEstimateSet: boolean;
  costPerJobBooked: boolean;
  costOfMarketingPercent: boolean;
}

export default function AdPerformanceBoard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BoardRow[]>([]);
  const [groupBy, setGroupBy] = useState<'campaign' | 'adset' | 'ad'>('campaign');
  
  // Filters state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Columns state - all enabled by default
  const [columns, setColumns] = useState<BoardColumns>({
    campaignName: true,
    adSetName: false,
    adName: false,
    numberOfLeads: true,
    numberOfEstimateSets: true,
    numberOfJobsBooked: true,
    numberOfUnqualifiedLeads: false,
    costPerLead: true,
    costPerEstimateSet: true,
    costPerJobBooked: true,
    costOfMarketingPercent: true,
  });

  // Auto-adjust columns based on groupBy
  useEffect(() => {
    setColumns((prev) => ({
      ...prev,
      campaignName: true,
      adSetName: groupBy === 'adset' || groupBy === 'ad',
      adName: groupBy === 'ad',
    }));
  }, [groupBy]);

  const fetchData = () => {
    setLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      // Dummy data based on groupBy
      let dummyData: BoardRow[] = [];

      if (groupBy === 'campaign') {
        dummyData = [
          {
            campaignName: 'Home Services Q1 2025',
            numberOfLeads: 145,
            numberOfEstimateSets: 42,
            numberOfJobsBooked: 28,
            numberOfUnqualifiedLeads: 15,
            costPerLead: 45.50,
            costPerEstimateSet: 157.14,
            costPerJobBooked: 235.71,
            costOfMarketingPercent: 12.5,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            numberOfLeads: 89,
            numberOfEstimateSets: 25,
            numberOfJobsBooked: 18,
            numberOfUnqualifiedLeads: 8,
            costPerLead: 52.30,
            costPerEstimateSet: 186.16,
            costPerJobBooked: 258.89,
            costOfMarketingPercent: 14.2,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            numberOfLeads: 67,
            numberOfEstimateSets: 22,
            numberOfJobsBooked: 15,
            numberOfUnqualifiedLeads: 5,
            costPerLead: 38.80,
            costPerEstimateSet: 118.18,
            costPerJobBooked: 173.33,
            costOfMarketingPercent: 9.8,
          },
        ];
      } else if (groupBy === 'adset') {
        dummyData = [
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Retargeting - Website Visitors',
            numberOfLeads: 85,
            numberOfEstimateSets: 28,
            numberOfJobsBooked: 20,
            numberOfUnqualifiedLeads: 5,
            costPerLead: 42.35,
            costPerEstimateSet: 128.39,
            costPerJobBooked: 180.00,
            costOfMarketingPercent: 10.5,
          },
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Cold Audience - Lookalike 1%',
            numberOfLeads: 60,
            numberOfEstimateSets: 14,
            numberOfJobsBooked: 8,
            numberOfUnqualifiedLeads: 10,
            costPerLead: 50.00,
            costPerEstimateSet: 214.29,
            costPerJobBooked: 375.00,
            costOfMarketingPercent: 16.8,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: '24/7 Emergency Response',
            numberOfLeads: 52,
            numberOfEstimateSets: 18,
            numberOfJobsBooked: 12,
            numberOfUnqualifiedLeads: 4,
            costPerLead: 48.08,
            costPerEstimateSet: 138.89,
            costPerJobBooked: 208.33,
            costOfMarketingPercent: 11.2,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: 'Winter Maintenance Special',
            numberOfLeads: 37,
            numberOfEstimateSets: 7,
            numberOfJobsBooked: 6,
            numberOfUnqualifiedLeads: 4,
            costPerLead: 59.46,
            costPerEstimateSet: 314.29,
            costPerJobBooked: 366.67,
            costOfMarketingPercent: 18.5,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Spring Home Refresh',
            numberOfLeads: 38,
            numberOfEstimateSets: 13,
            numberOfJobsBooked: 9,
            numberOfUnqualifiedLeads: 3,
            costPerLead: 36.84,
            costPerEstimateSet: 107.69,
            costPerJobBooked: 155.56,
            costOfMarketingPercent: 8.9,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Home Renovation Leads',
            numberOfLeads: 29,
            numberOfEstimateSets: 9,
            numberOfJobsBooked: 6,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 41.38,
            costPerEstimateSet: 133.33,
            costPerJobBooked: 200.00,
            costOfMarketingPercent: 11.2,
          },
        ];
      } else if (groupBy === 'ad') {
        dummyData = [
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Retargeting - Website Visitors',
            adName: 'HVAC Service - Video Ad',
            numberOfLeads: 45,
            numberOfEstimateSets: 15,
            numberOfJobsBooked: 12,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 40.00,
            costPerEstimateSet: 120.00,
            costPerJobBooked: 150.00,
            costOfMarketingPercent: 8.5,
          },
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Retargeting - Website Visitors',
            adName: 'Plumbing Emergency - Static Image',
            numberOfLeads: 40,
            numberOfEstimateSets: 13,
            numberOfJobsBooked: 8,
            numberOfUnqualifiedLeads: 3,
            costPerLead: 45.00,
            costPerEstimateSet: 138.46,
            costPerJobBooked: 225.00,
            costOfMarketingPercent: 12.8,
          },
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Cold Audience - Lookalike 1%',
            adName: 'Electrical Services - Carousel',
            numberOfLeads: 35,
            numberOfEstimateSets: 8,
            numberOfJobsBooked: 5,
            numberOfUnqualifiedLeads: 6,
            costPerLead: 52.86,
            costPerEstimateSet: 231.25,
            costPerJobBooked: 370.00,
            costOfMarketingPercent: 18.2,
          },
          {
            campaignName: 'Home Services Q1 2025',
            adSetName: 'Cold Audience - Lookalike 1%',
            adName: 'Roofing Repair - Video',
            numberOfLeads: 25,
            numberOfEstimateSets: 6,
            numberOfJobsBooked: 3,
            numberOfUnqualifiedLeads: 4,
            costPerLead: 46.00,
            costPerEstimateSet: 191.67,
            costPerJobBooked: 383.33,
            costOfMarketingPercent: 15.8,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: '24/7 Emergency Response',
            adName: '24/7 Emergency Plumbing - Video',
            numberOfLeads: 28,
            numberOfEstimateSets: 10,
            numberOfJobsBooked: 7,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 46.43,
            costPerEstimateSet: 130.00,
            costPerJobBooked: 185.71,
            costOfMarketingPercent: 10.1,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: '24/7 Emergency Response',
            adName: 'Heating Repair Special - Static',
            numberOfLeads: 24,
            numberOfEstimateSets: 8,
            numberOfJobsBooked: 5,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 50.00,
            costPerEstimateSet: 150.00,
            costPerJobBooked: 240.00,
            costOfMarketingPercent: 12.5,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: 'Winter Maintenance Special',
            adName: 'Winter HVAC Checkup - Carousel',
            numberOfLeads: 20,
            numberOfEstimateSets: 4,
            numberOfJobsBooked: 3,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 55.00,
            costPerEstimateSet: 275.00,
            costPerJobBooked: 366.67,
            costOfMarketingPercent: 16.2,
          },
          {
            campaignName: 'Emergency Services Winter 2025',
            adSetName: 'Winter Maintenance Special',
            adName: 'Furnace Tune-Up - Video',
            numberOfLeads: 17,
            numberOfEstimateSets: 3,
            numberOfJobsBooked: 3,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 64.71,
            costPerEstimateSet: 366.67,
            costPerJobBooked: 366.67,
            costOfMarketingPercent: 21.5,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Spring Home Refresh',
            adName: 'Kitchen Remodel - Video',
            numberOfLeads: 22,
            numberOfEstimateSets: 8,
            numberOfJobsBooked: 6,
            numberOfUnqualifiedLeads: 1,
            costPerLead: 36.36,
            costPerEstimateSet: 100.00,
            costPerJobBooked: 133.33,
            costOfMarketingPercent: 7.8,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Spring Home Refresh',
            adName: 'Bathroom Renovation - Static',
            numberOfLeads: 16,
            numberOfEstimateSets: 5,
            numberOfJobsBooked: 3,
            numberOfUnqualifiedLeads: 2,
            costPerLead: 37.50,
            costPerEstimateSet: 120.00,
            costPerJobBooked: 200.00,
            costOfMarketingPercent: 10.5,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Home Renovation Leads',
            adName: 'Complete Home Makeover - Carousel',
            numberOfLeads: 18,
            numberOfEstimateSets: 6,
            numberOfJobsBooked: 4,
            numberOfUnqualifiedLeads: 1,
            costPerLead: 38.89,
            costPerEstimateSet: 116.67,
            costPerJobBooked: 175.00,
            costOfMarketingPercent: 9.2,
          },
          {
            campaignName: 'Spring Home Improvement 2025',
            adSetName: 'Home Renovation Leads',
            adName: 'Flooring Installation - Video',
            numberOfLeads: 11,
            numberOfEstimateSets: 3,
            numberOfJobsBooked: 2,
            numberOfUnqualifiedLeads: 1,
            costPerLead: 45.45,
            costPerEstimateSet: 166.67,
            costPerJobBooked: 250.00,
            costOfMarketingPercent: 14.8,
          },
        ];
      }

      setData(dummyData);
      toast({
        title: 'Success',
        description: `Loaded ${dummyData.length} rows (dummy data)`,
      });
      setLoading(false);
    }, 500); // 500ms delay to simulate API call
  };

  useEffect(() => {
    fetchData();
  }, [groupBy]); // Reload when groupBy changes

  const toggleColumn = (columnName: keyof BoardColumns) => {
    setColumns((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(2)}%`;
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    // Get active column headers
    const headers = Object.entries(columns)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);

    // Convert to CSV
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof BoardRow];
            if (value === null || value === undefined) return '';
            return typeof value === 'number' ? value : `"${value}"`;
          })
          .join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-performance-${groupBy}-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Board</CardTitle>
          <CardDescription>
            Analyze your Facebook ad performance with flexible grouping and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="adset">Ad Set</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button onClick={fetchData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Columns
            </Button>

            <Button variant="outline" onClick={exportToCSV} disabled={data.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Column Selector */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Columns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(columns).map(([key, enabled]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={enabled}
                        onCheckedChange={() => toggleColumn(key as keyof BoardColumns)}
                        disabled={
                          (key === 'campaignName' && groupBy === 'campaign') ||
                          (key === 'adSetName' && (groupBy === 'adset' || groupBy === 'ad')) ||
                          (key === 'adName' && groupBy === 'ad')
                        }
                      />
                      <Label htmlFor={key} className="text-sm cursor-pointer">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          {data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, row) => sum + (row.numberOfLeads || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, row) => sum + (row.numberOfEstimateSets || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Estimates Set</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, row) => sum + (row.numberOfJobsBooked || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Jobs Booked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{data.length}</div>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.campaignName && <TableHead>Campaign</TableHead>}
                  {columns.adSetName && <TableHead>Ad Set</TableHead>}
                  {columns.adName && <TableHead>Ad Name</TableHead>}
                  {columns.numberOfLeads && <TableHead className="text-right">Leads</TableHead>}
                  {columns.numberOfEstimateSets && <TableHead className="text-right">Estimates</TableHead>}
                  {columns.numberOfJobsBooked && <TableHead className="text-right">Jobs</TableHead>}
                  {columns.numberOfUnqualifiedLeads && <TableHead className="text-right">Unqualified</TableHead>}
                  {columns.costPerLead && <TableHead className="text-right">Cost/Lead</TableHead>}
                  {columns.costPerEstimateSet && <TableHead className="text-right">Cost/Estimate</TableHead>}
                  {columns.costPerJobBooked && <TableHead className="text-right">Cost/Job</TableHead>}
                  {columns.costOfMarketingPercent && <TableHead className="text-right">Marketing %</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(columns).filter(Boolean).length} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(columns).filter(Boolean).length} className="text-center py-8">
                      No data found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.campaignName && (
                        <TableCell className="font-medium">{row.campaignName}</TableCell>
                      )}
                      {columns.adSetName && <TableCell>{row.adSetName}</TableCell>}
                      {columns.adName && <TableCell className="max-w-xs truncate">{row.adName}</TableCell>}
                      {columns.numberOfLeads && (
                        <TableCell className="text-right">
                          <Badge variant="secondary">{row.numberOfLeads}</Badge>
                        </TableCell>
                      )}
                      {columns.numberOfEstimateSets && (
                        <TableCell className="text-right">
                          <Badge variant="outline">{row.numberOfEstimateSets}</Badge>
                        </TableCell>
                      )}
                      {columns.numberOfJobsBooked && (
                        <TableCell className="text-right">
                          <Badge variant="default">{row.numberOfJobsBooked}</Badge>
                        </TableCell>
                      )}
                      {columns.numberOfUnqualifiedLeads && (
                        <TableCell className="text-right">
                          <Badge variant="destructive">{row.numberOfUnqualifiedLeads}</Badge>
                        </TableCell>
                      )}
                      {columns.costPerLead && (
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.costPerLead)}
                        </TableCell>
                      )}
                      {columns.costPerEstimateSet && (
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.costPerEstimateSet)}
                        </TableCell>
                      )}
                      {columns.costPerJobBooked && (
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.costPerJobBooked)}
                        </TableCell>
                      )}
                      {columns.costOfMarketingPercent && (
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              row.costOfMarketingPercent && row.costOfMarketingPercent > 20
                                ? 'text-red-600'
                                : row.costOfMarketingPercent && row.costOfMarketingPercent < 10
                                ? 'text-green-600'
                                : ''
                            }
                          >
                            {formatPercent(row.costOfMarketingPercent)}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
