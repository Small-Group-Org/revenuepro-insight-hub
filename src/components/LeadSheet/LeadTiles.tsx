import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Mail, Phone, Tag, Target, Users, Save, FileEdit, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

// Memoized component for lead tiles to optimize re-renders
export const LeadTiles = React.memo(({ 
    leads, 
    isDisabled, 
    pendingULRLeadId, 
    showCustomInput, 
    customULR, 
    ULR_OPTIONS,
    selectedLeads,
    userRole,
    handleLeadStatusChange,
    handleULRChange,
    handleCustomULRSubmit,
    handleAmountUpdate,
    handleNoteUpdate,
    handleLeadDelete,
    handleLeadSelect,
    setCustomULR,
    setShowCustomInput,
    formatDate,
    getScoreInfo,
    getStatusInfo,
    FIELD_WEIGHTS
  }: {
    leads: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      zip: string;
      service: string;
      adSetName: string;
      adName: string;
      status: string;
      leadDate: string;
      score: number;
      leadScore?: number;
      unqualifiedLeadReason?: string;
      jobBookedAmount?: number;
      proposalAmount?: number;
      notes?: string;
      conversionRates?: {
        service?: number;
        adSetName?: number;
        adName?: number;
        leadDate?: number;
        zip?: number;
      };
      tooltipData?: {
        serviceRate: string;
        adSetRate: string;
        adNameRate: string;
        dateRate: string;
        zipRate: string;
      };
    }>;
    isDisabled: boolean;
    pendingULRLeadId: string | null;
    showCustomInput: string | null;
    customULR: string;
    ULR_OPTIONS: string[];
    selectedLeads: Set<string>;
    userRole: string;
    handleLeadStatusChange: (leadId: string, value: 'new' | 'in_progress' | 'estimate_set' | 'unqualified') => Promise<void>;
    handleULRChange: (leadId: string, value: string) => Promise<void>;
    handleCustomULRSubmit: (leadId: string) => Promise<void>;
    handleAmountUpdate: (leadId: string, jobBookedAmount: number, proposalAmount: number) => Promise<void>;
    handleNoteUpdate: (leadId: string, notes: string) => Promise<void>;
    handleLeadDelete: (leadId: string) => void;
    handleLeadSelect: (leadId: string, isSelected: boolean) => void;
    setCustomULR: (value: string) => void;
    setShowCustomInput: (value: string | null) => void;
    formatDate: (dateString: string) => string;
    getScoreInfo: (score: number) => { color: string; label: string };
    getStatusInfo: (status: string) => { color: string; label: string };
    FIELD_WEIGHTS: { zip: number; service: number; adSetName: number; adName: number };
  }) => {
    // State for managing amount inputs
    const [amountInputs, setAmountInputs] = useState<{[leadId: string]: {jobBookedAmount: number, proposalAmount: number}}>({});
    // State for tracking which lead is being edited
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    // Note editing state
    const [editingNoteLeadId, setEditingNoteLeadId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState<string>("");
    const notePopupRef = useRef<HTMLDivElement>(null);

    const startEditingNote = (leadId: string) => {
      const lead = leads.find(l => l.id === leadId);
      setEditingNoteLeadId(leadId);
      setNoteDraft(lead?.notes || "");
    };

    const saveNote = async (leadId: string) => {
      // Trim the note and ensure it doesn't exceed the character limit
      const trimmedNote = noteDraft.trim();
      if (trimmedNote.length > 2000) {
        return; // Don't save if it exceeds the limit
      }
      await handleNoteUpdate(leadId, trimmedNote);
      setEditingNoteLeadId(null);
      setNoteDraft("");
    };

    const cancelEditingNote = () => {
      setEditingNoteLeadId(null);
      setNoteDraft("");
    };

    // Handle click outside to close note popup
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (notePopupRef.current && !notePopupRef.current.contains(event.target as Node)) {
          if (editingNoteLeadId) {
            cancelEditingNote();
          }
        }
      };

      if (editingNoteLeadId) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [editingNoteLeadId]);

    // Initialize amount inputs when leads change
    React.useEffect(() => {
      const newAmountInputs: {[leadId: string]: {jobBookedAmount: number, proposalAmount: number}} = {};
      leads.forEach(lead => {
        if (lead.status === 'estimate_set') {
          newAmountInputs[lead.id] = {
            jobBookedAmount: lead.jobBookedAmount || 0,
            proposalAmount: lead.proposalAmount || 0
          };
        }
      });
      setAmountInputs(newAmountInputs);
    }, [leads]);

    return (
      <div className="space-y-4">
        {leads.map((lead) => {
        const scoreInfo = getScoreInfo(lead.score);
        const statusInfo = getStatusInfo(lead.status);
        const isSelected = selectedLeads.has(lead.id);
        
        // Determine hover styling based on status and selection
        const getHoverStyling = () => {
          if (isSelected) {
            // When selected, use blue hover effects
            return 'hover:border-blue-500 hover:shadow-xl hover:shadow-blue-300/50';
          }
          
          switch (lead.status) {
            case 'estimate_set':
              return 'hover:border-green-300 hover:shadow-xl hover:shadow-green-200/50';
            case 'unqualified':
              return 'hover:border-red-300 hover:shadow-xl hover:shadow-red-200/50';
            case 'in_progress':
              return 'hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-200/50';
            case 'new':
              return 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-200/50';
            default:
              return 'hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50';
          }
        };
        
        return (
          <div 
            key={lead.id} 
            className={`rounded-lg border-2 p-6 transition-all duration-200 shadow-sm ${
              isSelected 
                ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-200/50' 
                : 'border-gray-200 bg-white'
            } ${getHoverStyling()} ${isDisabled ? 'opacity-60' : ''} group relative`}
          >
            {/* Checkbox - appears on hover or when checked - Only for ADMIN role */}
            {userRole === 'ADMIN' && (
              <div className={`absolute top-1 left-2 transition-opacity duration-200 z-10 ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleLeadSelect(lead.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer"
                  disabled={isDisabled}
                />
              </div>
            )}
            
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Lead Score */}
              <div className="col-span-1 flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative cursor-wait hover:cursor-help group">
                        <div className="w-14 h-14 relative">
                          {/* Loading overlay - appears on hover before tooltip */}
                          <div className="absolute inset-0 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          {/* Background circle */}
                          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={scoreInfo.color.includes('green') ? '#10b981' : 
                                     scoreInfo.color.includes('yellow') ? '#f59e0b' : 
                                     scoreInfo.color.includes('red') ? '#ef4444' : '#6366f1'}
                              strokeWidth="3"
                              strokeDasharray={`${lead.score}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          {/* Score text */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-900">
                              {lead.score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-4 bg-white border border-gray-200 shadow-lg rounded-lg">
                      <div className="space-y-4">
                        {/* Header with score */}
                        <div className="bg-blue-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-blue-800">Lead Score:</span>
                            <span className="text-xl font-bold text-blue-600">{lead.score}%</span>
                          </div>
                          <p className="text-xs text-blue-700">
                            Calculated as weighted average of conversion rates
                          </p>
                        </div>
  
                        {/* Conversion rates */}
                        <div className="space-y-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Conversion Rates:</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Zip ({lead.zip}):</span>
                            <span className="font-semibold text-gray-800">{lead.tooltipData.zipRate}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Service ({lead.service}):</span>
                            <span className="font-semibold text-gray-800">{lead.tooltipData.serviceRate}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Ad Set ({lead.adSetName}):</span>
                            <span className="font-semibold text-gray-800">{lead.tooltipData.adSetRate}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Ad Name ({lead.adName}):</span>
                            <span className="font-semibold text-gray-800">{lead.tooltipData.adNameRate}%</span>
                          </div>
                        </div>
  
                        {/* Weights at bottom */}
                        <div className="bg-gray-100 px-3 py-2 rounded-lg">
                          <div className="text-xs font-semibold text-gray-700 mb-1">Weights:</div>
                          <p className="text-xs text-gray-500">
                            (Zip - {FIELD_WEIGHTS.zip}% • Service - {FIELD_WEIGHTS.service}% • Ad Set - {FIELD_WEIGHTS.adSetName}% • Ad Name - {FIELD_WEIGHTS.adName}%)
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
  
              {/* Name */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="font-semibold text-gray-900 text-sm truncate cursor-help">
                            {lead.name}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{lead.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
  
              {/* Contact Details */}
              <div className="col-span-2 flex items-center">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1 text-xs">
                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a 
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate block min-w-0 flex-1 cursor-help"
                          >
                            {lead.email}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{lead.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline truncate block min-w-0 flex-1"
                    >
                      {lead.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-blue-600 truncate block min-w-0 flex-1">
                      {lead.zip}
                    </span>
                  </div>
                </div>
              </div>
  
              {/* Date */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>{formatDate(lead.leadDate)}</span>
                </div>
              </div>
  
              {/* Service & Ads */}
              <div className="col-span-3 flex items-center">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1 text-xs">
                    <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-gray-600 truncate font-medium block min-w-0 flex-1 cursor-help">
                            {lead.service}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{lead.service}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-gray-600 truncate block min-w-0 flex-1 cursor-help">
                            {lead.adSetName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{lead.adSetName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-gray-600 truncate block min-w-0 flex-1 cursor-help">
                            {lead.adName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{lead.adName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {/* Feature Note (Dummy) */}
                  <div className="flex items-start gap-1 text-xs relative">
                    <div className="flex-1">
                      {lead.notes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="flex items-center gap-1 cursor-pointer group"
                                onClick={() => !isDisabled && startEditingNote(lead.id)}
                              >
                                <FileEdit className="w-3 h-3 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors" />
                                <span className="text-gray-700 truncate block min-w-0 bg-amber-50 group-hover:bg-amber-50 px-2 py-1 rounded-md border border-amber-100 group-hover:border-amber-200 transition-all duration-200">
                                  {lead.notes.length > 50 ? `${lead.notes.substring(0, 42)}...` : lead.notes}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="text-sm">
                                <div className="font-medium mb-1">Note:</div>
                                <div className="whitespace-pre-wrap break-words">
                                  {lead.notes}
                                </div>
                                {/* <div className="text-xs text-gray-500 mt-1">
                                  {lead.notes.length}/2000 characters
                                </div> */}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div 
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          onClick={() => !isDisabled && startEditingNote(lead.id)}
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>Add Note</span>
                        </div>
                      )}
                      
                      {/* Inline editing tooltip popup */}
                      {editingNoteLeadId === lead.id && (
                        <div 
                          ref={notePopupRef}
                          className="absolute top-6 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64"
                        >
                          <textarea
                            value={noteDraft}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 2000) {
                                setNoteDraft(value);
                              }
                            }}
                            placeholder="Write a quick note about this lead's service/ads..."
                            className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y ${
                              noteDraft.length > 2000 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300'
                            }`}
                            rows={3}
                            disabled={isDisabled}
                            autoFocus
                            maxLength={2000}
                            style={{ minHeight: '60px', maxHeight: '200px' }}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <div className={`text-xs ${noteDraft.length > 2000 ? 'text-red-500' : 'text-gray-500'}`}>
                              {noteDraft.length}/2000 characters
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={cancelEditingNote}
                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => saveNote(lead.id)}
                                className={`p-1 rounded transition-colors ${
                                  noteDraft.length > 2000 || noteDraft.trim().length === 0
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                }`}
                                disabled={isDisabled || noteDraft.length > 2000 || noteDraft.trim().length === 0}
                                title={noteDraft.length > 2000 ? 'Note too long' : noteDraft.trim().length === 0 ? 'Note cannot be empty' : 'Save note'}
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Lead Status */}
              <div className="col-span-2 flex items-center">
                <div className="w-full">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => !isDisabled ? handleLeadStatusChange(lead.id, value as 'new' | 'in_progress' | 'estimate_set' | 'unqualified') : undefined}
                    disabled={isDisabled}
                  >
                    <SelectTrigger 
                      className={`w-full h-8 text-xs border-2 ${
                        pendingULRLeadId === lead.id 
                          ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                      } transition-all duration-200`}
                    >
                      <SelectValue>
                        <span className={`px-2 py-1 rounded text-xs border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-sm">
                        <span className="inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          New
                        </span>
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-sm">
                        <span className="inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          In Progress
                        </span>
                      </SelectItem>
                      <SelectItem value="estimate_set" className="text-sm">
                        <span className="inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Estimate Set
                        </span>
                      </SelectItem>
                      <SelectItem value="unqualified" className="text-sm">
                        <span className="inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Unqualified
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
  
                  {/* Unqualified Reason Dropdown - Only show when status is unqualified */}
                  {lead.status === 'unqualified' && (
                    <div className="mt-3">
                      {showCustomInput === lead.id ? (
                        <div className="space-y-1 mt-2">
                          <input
                            type="text"
                            value={customULR}
                            onChange={(e) => setCustomULR(e.target.value)}
                            placeholder="Enter reason..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomULRSubmit(lead.id)}
                            disabled={isDisabled}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCustomULRSubmit(lead.id)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDisabled}
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
                          onValueChange={(value) => !isDisabled ? handleULRChange(lead.id, value) : undefined}
                          disabled={isDisabled}
                        >
                          <SelectTrigger 
                            className={`w-full h-8 text-xs border-2 ${
                              pendingULRLeadId === lead.id 
                                ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                                : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                            } transition-all duration-200`}
                          >
                            <SelectValue placeholder={pendingULRLeadId === lead.id ? "Select reason!" : "Reason..."}>
                              {lead.unqualifiedLeadReason && !ULR_OPTIONS.includes(lead.unqualifiedLeadReason) ? (
                                <span className="text-blue-600 font-medium text-xs">"{lead.unqualifiedLeadReason}"</span>
                              ) : (
                                <span className="text-xs">{lead.unqualifiedLeadReason}</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ULR_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="text-sm">
                                {option}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom" className="text-sm font-medium text-blue-600">
                              + Add Custom Reason
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Amount Fields - Only show when status is estimate_set */}
                  {lead.status === 'estimate_set' && (
                    <div className="mt-2 space-y-2 flex items-center  ">
                      <div className="flex items-start flex-wrap gap-1 justify-around  w-full">

                       {/* Proposal Amount */}
                        <div className={`flex flex-col items-center gap-1`}>
                          {editingLeadId === lead.id ? (
                            <>
                              <input
                                type="number"
                                value={amountInputs[lead.id]?.proposalAmount || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setAmountInputs(prev => ({
                                    ...prev,
                                    [lead.id]: {
                                      ...prev[lead.id],
                                      proposalAmount: value
                                    }
                                  }));
                                }}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                disabled={isDisabled}
                                min="0"
                                step="0.01"
                              />
                            </>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
                              onClick={() => {
                                if (!isDisabled && editingLeadId !== lead.id) {
                                  setEditingLeadId(lead.id);
                                }
                              }}
                            >
                              <span className="text-xs font-medium">${lead.proposalAmount || 0}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 text-wrap text-center w-20 ">
                             Proposal Amount
                          </div>
                        </div>

                        {/* Job Booked Amount */}
                        <div className={`flex flex-col items-center gap-1`}>
                          {editingLeadId === lead.id ? (
                            <>
                              <input
                                type="number"
                                value={amountInputs[lead.id]?.jobBookedAmount || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setAmountInputs(prev => ({
                                    ...prev,
                                    [lead.id]: {
                                      ...prev[lead.id],
                                      jobBookedAmount: value
                                    }
                                  }));
                                }}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                disabled={isDisabled}
                                min="0"
                                step="0.01"
                              />
                            </>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1"
                              onClick={() => {
                                if (!isDisabled && editingLeadId !== lead.id) {
                                  setEditingLeadId(lead.id);
                                }
                              }}
                            >
                              <span className="text-xs font-medium">${lead.jobBookedAmount || 0}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 text-wrap text-center w-20 ">
                            Job Booked Amount
                          </div>
                        </div>

                     

                        {/* Save Button - Only show when editing */}
                        {editingLeadId === lead.id && (
                          <button
                            onClick={() => {
                              const jobBookedAmount = amountInputs[lead.id]?.jobBookedAmount || 0;
                              const proposalAmount = amountInputs[lead.id]?.proposalAmount || 0;
                              handleAmountUpdate(lead.id, jobBookedAmount, proposalAmount);
                              setEditingLeadId(null);
                            }}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            disabled={isDisabled}
                            title="Save amounts"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    );
  });
  