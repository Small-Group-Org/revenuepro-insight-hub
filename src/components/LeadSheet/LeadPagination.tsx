import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface LeadPaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  pageSize: number;
  processedLeads: any[];
  loading: boolean;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const LeadPagination = React.memo(({
  pagination,
  currentPage,
  pageSize,
  processedLeads,
  loading,
  setCurrentPage,
  setPageSize
}: LeadPaginationProps) => {
  if (!pagination || processedLeads.length === 0 || loading) {
    return null;
  }

  return (
    <div className="mt-8 flex justify-between items-center">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
        <span>Show</span>
        <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span>leads per page</span>
      </div>

      {/* Pagination - Right aligned */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col items-end gap-0">
          <Pagination>
            <PaginationContent>
              {/* Previous Page */}
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {/* First Page (if not in first 3 pages) */}
              {pagination.totalPages > 5 && pagination.currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(1)}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                </>
              )}

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === pagination.currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Last Page (if not in last 3 pages) */}
              {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      className="cursor-pointer"
                    >
                      {pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              {/* Next Page */}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Total Count Display - Below pagination */}
          <div className="text-xs mr-4 text-gray-500 whitespace-nowrap">
            ({pagination.totalCount.toLocaleString()} total leads)
          </div>
        </div>
      )}
    </div>
  );
});

LeadPagination.displayName = 'LeadPagination';
