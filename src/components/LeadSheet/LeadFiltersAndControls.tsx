import React from 'react';
import { Calendar, Star, Download, Trash2, Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getStatusInfo } from '@/utils/leads/leadProcessing';

interface CurrentFilters {
  adSetName?: string;
  adName?: string;
  status?: string;
  unqualifiedLeadReason?: string;
  searchName?: string;
}

interface CurrentSorting {
  sortBy: 'date' | 'score';
  sortOrder: 'asc' | 'desc';
}

interface FilterOptions {
  adSetNames: string[];
  adNames: string[];
  statuses: string[];
  unqualifiedLeadReasons: string[];
}

interface LeadFiltersAndControlsProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  currentFilters: CurrentFilters;
  currentSorting: CurrentSorting;
  filterOptions: FilterOptions | null;
  processedLeads: any[];
  pagination: any;
  hasActiveFilters: boolean;
  selectedLeads: Set<string>;
  userRole: string;
  setFilters: (filters: Partial<{ adSetName?: string; adName?: string; status?: string; unqualifiedLeadReason?: string; searchName?: string }>) => void;
  setSorting: (sortBy: 'date' | 'score', sortOrder: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  handleClearFilters: () => void;
  exportToExcel: (type: 'current' | 'all') => void;
  handleBulkDelete: () => void;
}

export const LeadFiltersAndControls = React.memo(({
  showFilters,
  setShowFilters,
  currentFilters,
  currentSorting,
  filterOptions,
  processedLeads,
  pagination,
  hasActiveFilters,
  selectedLeads,
  userRole,
  setFilters,
  setSorting,
  setCurrentPage,
  handleClearFilters,
  exportToExcel,
  handleBulkDelete
}: LeadFiltersAndControlsProps) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg p-4">
    {/* Filters Section - Appears Above When Toggled */}
    {showFilters && (
      <div className="mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Adset Name Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Ad Set Name</label>
            <Select 
              value={currentFilters.adSetName || 'all'} 
              onValueChange={(v) => {
                setFilters({ adSetName: v === 'all' ? undefined : v });
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                <SelectValue placeholder="All Ad Sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ad Sets</SelectItem>
                {filterOptions?.adSetNames.map(adset => (
                  <SelectItem key={adset} value={adset}>
                    {adset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ad Name Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Ad Name</label>
            <Select 
              value={currentFilters.adName || 'all'} 
              onValueChange={(v) => {
                setFilters({ adName: v === 'all' ? undefined : v });
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                <SelectValue placeholder="All Ads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ads</SelectItem>
                {filterOptions?.adNames.map(ad => (
                  <SelectItem key={ad} value={ad}>
                    {ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lead Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Lead Status</label>
            <Select 
              value={currentFilters.status || 'all'} 
              onValueChange={(v) => {
                setFilters({ status: v === 'all' ? undefined : v });
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {filterOptions?.statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {getStatusInfo(status as 'new' | 'in_progress' | 'estimate_set' | 'unqualified').label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unqualified Reason Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Unqualified Reason</label>
            <Select 
              value={currentFilters.unqualifiedLeadReason || 'all'} 
              onValueChange={(v) => {
                setFilters({ unqualifiedLeadReason: v === 'all' ? undefined : v });
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {filterOptions?.unqualifiedLeadReasons.map(ulr => (
                  <SelectItem key={ulr} value={ulr}>
                    {ulr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {currentFilters.adSetName && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Ad Set: {currentFilters.adSetName}
                </Badge>
              )}
              {currentFilters.adName && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Ad: {currentFilters.adName}
                </Badge>
              )}
              {currentFilters.status && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Status: {getStatusInfo(currentFilters.status as 'new' | 'in_progress' | 'estimate_set' | 'unqualified').label}
                </Badge>
              )}
              {currentFilters.unqualifiedLeadReason && (
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Unqualified Reason: {currentFilters.unqualifiedLeadReason}
                </Badge>
              )}
              {currentFilters.searchName && (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Search: "{currentFilters.searchName}"
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xs text-gray-600">
                Showing {processedLeads.length} of {pagination?.totalCount || 0} leads
                {pagination && ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
              </p>
              <span className="text-gray-400">•</span>
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Main Controls Row */}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-medium shadow-sm ${
            showFilters 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
              {Object.values(currentFilters).filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Sort Controls */}
        <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Sort by
        </span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => {
              setSorting('date', currentSorting.sortOrder);
              setCurrentPage(1); // Reset to first page when sorting changes
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              currentSorting.sortBy === 'date' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            } border-r border-gray-200`}
          >
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 
              Date
            </span>
          </button>
          <button 
            onClick={() => {
              setSorting('score', currentSorting.sortOrder);
              setCurrentPage(1); // Reset to first page when sorting changes
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              currentSorting.sortBy === 'score' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3" /> 
              Lead Score
            </span>
          </button>
        </div>
        {currentSorting.sortBy === 'date' ? (
          <button
            onClick={() => {
              setSorting('date', currentSorting.sortOrder === 'desc' ? 'asc' : 'desc');
              setCurrentPage(1); // Reset to first page when sorting changes
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium text-gray-700 shadow-sm"
          >
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>{currentSorting.sortOrder === 'desc' ? 'Newest → Oldest' : 'Oldest → Newest'}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setSorting('score', currentSorting.sortOrder === 'desc' ? 'asc' : 'desc');
              setCurrentPage(1); // Reset to first page when sorting changes
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium text-gray-700 shadow-sm"
          >
            <Star className="w-3 h-3 text-gray-500" />
            <span>{currentSorting.sortOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
          </button>
        )}
        
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Leads..."
              value={currentFilters.searchName || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ searchName: value || undefined });  // Set to undefined if empty
                setCurrentPage(1); // Reset to first page when search changes
              }}
              className="pl-9 pr-8 h-8 w-96 text-xs border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {currentFilters.searchName && (
              <button
                onClick={() => {
                  setFilters({ searchName: undefined });
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Delete Button - Only show when leads are selected and user is ADMIN */}
        {selectedLeads.size > 0 && userRole === 'ADMIN' && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 p-3 hover:text-red-50 bg-red-100 border border-red-200 text-white rounded-md hover:bg-red-200 transition-all text-xs font-medium shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
        
        {/* Export Dropdown */}
        <Select onValueChange={(value) => exportToExcel(value as 'current' | 'all')}>
          <SelectTrigger 
            disabled={processedLeads.length === 0}
            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-xs font-medium shadow-sm border-0 w-auto min-w-0"
          >
            <Download className="w-3 h-3" />
            Export
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">
              Current Page ({processedLeads.length} leads)
            </SelectItem>
            <SelectItem value="all">
              All Filtered Data ({pagination?.totalCount || 0} leads)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
));

LeadFiltersAndControls.displayName = 'LeadFiltersAndControls';
