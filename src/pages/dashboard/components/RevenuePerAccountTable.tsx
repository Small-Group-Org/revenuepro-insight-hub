import React, { useState, useMemo } from 'react';
import { IUserRevenue } from '@/service/reportingServices';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '@/utils/page-utils/commonUtils';
import { REVENUE_TABLE_HEADERS, SortField } from '../dashboard.constant';

interface RevenuePerAccountTableProps {
  usersBudgetAndRevenue: IUserRevenue[] | null;
}

type SortDirection = 'asc' | 'desc';

export const RevenuePerAccountTable: React.FC<RevenuePerAccountTableProps> = ({
  usersBudgetAndRevenue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Calculate Cost of Marketing % for a user
  const calculateCostOfMarketingPercent = (budgetSpent: number, revenue: number): number => {
    if (
      !Number.isFinite(revenue) ||
      !Number.isFinite(budgetSpent) ||
      revenue <= 0 ||
      budgetSpent <= 0
    ) {
      return 0;
    }
    return (budgetSpent / revenue) * 100;
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!usersBudgetAndRevenue || usersBudgetAndRevenue.length === 0) return [];

    // Filter out "Unknown User" entries
    let filtered = usersBudgetAndRevenue.filter((user) => {
      const userName = user.userName?.trim() || '';
      return userName.toLowerCase() !== 'unknown user';
    });

    // Filter by search query
    filtered = filtered.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.userName?.toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'totalRevenue') {
        aValue = a.totalRevenue || 0;
        bValue = b.totalRevenue || 0;
      } else if (sortField === 'totalBudgetSpent') {
        aValue = a.totalBudgetSpent || 0;
        bValue = b.totalBudgetSpent || 0;
      } else if (sortField === 'costOfMarketingPercent') {
        aValue = calculateCostOfMarketingPercent(a.totalBudgetSpent || 0, a.totalRevenue || 0);
        bValue = calculateCostOfMarketingPercent(b.totalBudgetSpent || 0, b.totalRevenue || 0);
      } else {
        aValue = a.userName || '';
        bValue = b.userName || '';
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      }
    });

    return filtered;
  }, [usersBudgetAndRevenue, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = processedData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  if (!usersBudgetAndRevenue || usersBudgetAndRevenue.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">
              Budget & Revenue Per Account
            </h3>
            <span className="text-sm text-muted-foreground">
              ({processedData.length} {processedData.length === 1 ? 'account' : 'accounts'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {REVENUE_TABLE_HEADERS.map((header, index) => {
                  const isRightAligned = header.align === 'right';
                  const isSortable = !!header.sortField;
                  const buttonClassName = 'h-8 -ml-3 hover:bg-transparent hover:text-black';

                  return (
                    <TableHead
                      key={index}
                      className={`${header.className || ''} ${isRightAligned ? 'text-right' : ''}`}
                    >
                      {header.isSpecial ? (
                        header.label
                      ) : isSortable ? (
                        <div className={isRightAligned ? 'flex justify-end' : ''}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={buttonClassName}
                            onClick={() => header.sortField && handleSort(header.sortField)}
                          >
                            {header.label}
                            {getSortIcon(header.sortField!)}
                          </Button>
                        </div>
                      ) : (
                        <div className={isRightAligned ? 'flex justify-end' : ''}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={buttonClassName}
                          >
                            {header.label}
                          </Button>
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No accounts found matching your search
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((user, index) => {
                  const { estimateSetCount, disqualifiedLeadsCount, totalRevenue, totalBudgetSpent, actualLeads } = user;
                  const costPerLead = actualLeads > 0 ? totalBudgetSpent / actualLeads : 0;
                  const costOfMarketingPercent = calculateCostOfMarketingPercent(
                    totalBudgetSpent || 0,
                    totalRevenue || 0
                  );
                  const estimateSetPercent = estimateSetCount === 0 ? 0 : (estimateSetCount/(estimateSetCount + disqualifiedLeadsCount)*100).toFixed(2);

                  return (
                    <TableRow key={user.userId}>
                      <TableCell className="text-muted-foreground">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.userName || user.userEmail || 'Unknown User'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className=" pr-10">
                            {formatCurrency(totalBudgetSpent || 0)}</div>
                        
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="pr-10">
                          {formatCurrency(totalRevenue || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="pr-10">
                        {costOfMarketingPercent.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="pr-10">
                        {estimateSetPercent}%
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="px-5">
                        ${costPerLead.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of{' '}
                {processedData.length} accounts
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

