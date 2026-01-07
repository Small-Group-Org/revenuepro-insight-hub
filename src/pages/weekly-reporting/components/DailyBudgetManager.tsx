import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, subDays, isBefore } from 'date-fns';
import { getCurrentWeek, getWeekInfo } from '@/utils/weekLogic';
import { Undo2, Trash2 } from 'lucide-react';
import { useUserContext } from '@/utils/UserContext';
import { getReportingData as fetchReportingData, upsertReportingData as saveReportingData } from '@/service/reportingServices';
import { useUserStore } from '@/stores/userStore';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

type AdNameAmount = {
  adName: string;
  budget: number;
};

interface DailyBudgetManagerProps {
  selectedDate: Date;
  weeklyBudget: number;
  initialAdNamesAmount?: AdNameAmount[];
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

// Allowed user IDs who can edit
const ALLOWED_EDIT_USER_IDS = [
  '68ae0fa4adbebc3a37f351ba',
  '68ae04ddadbebc3a37f34e39',
  '68ac6ebce46631727500499b',
  '68c06429a91e4097d8d1a05d',
  "683acb7561f26ee98f5d2d51"
  
];

const extractPreservedFields = (actual: Record<string, any> | null): Record<string, any> => {
  const preserved: Record<string, any> = {};
  if (!actual) return preserved;
  Object.keys(actual).forEach((key) => {
    if (
      key !== 'adNamesAmount' &&
      key !== 'userId' &&
      key !== '_id' &&
      key !== 'createdAt' &&
      key !== 'updatedAt' &&
      key !== '__v' &&
      key !== 'startDate' &&
      key !== 'endDate'
    ) {
      preserved[key] = actual[key];
    }
  });
  return preserved;
};

export const DailyBudgetManager: React.FC<DailyBudgetManagerProps> = ({
  selectedDate,
  weeklyBudget,
  initialAdNamesAmount = [],
}) => {
  const { user } = useUserContext();
  const selectedUserId = useUserStore((s) => s.selectedUserId);
  const autoPropagatedKeysRef = useRef<Set<string>>(new Set());
  const [rows, setRows] = useState<AdNameAmount[]>(
    Array.isArray(initialAdNamesAmount) && initialAdNamesAmount.length > 0
      ? initialAdNamesAmount
      : [{ adName: '', budget: 0 }]
  );
  const [existingFields, setExistingFields] = useState<Record<string, any>>({});
  const [deletedRows, setDeletedRows] = useState<AdNameAmount[]>([]);
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getDraftKey = useMemo(() => {
    const weekInfo = getWeekInfo(selectedDate);
    const start = format(weekInfo.weekStart, 'yyyy-MM-dd');
    const effectiveUserId = user?.role === 'ADMIN' ? (selectedUserId || user?._id) : user?._id;
    return effectiveUserId ? `dailyBudgetDraft:${effectiveUserId}:${start}` : '';
  }, [selectedDate, user?.role, user?._id, selectedUserId]);


  // Check if user can view the component (all admins can view)
  const canView = useMemo(() => {
    if (!user?._id) return false;
    const isAdmin = user.role === 'ADMIN';
    const isAllowedEditUser = ALLOWED_EDIT_USER_IDS.includes(user._id);
    return isAdmin || isAllowedEditUser;
  }, [user]);

  // Check if user can edit (only specific allowed user IDs can edit)
  const canEdit = useMemo(() => {
    if (!user?._id) return false;
    return ALLOWED_EDIT_USER_IDS.includes(user._id);
  }, [user]);

  const persistDraftRows = (nextRows: AdNameAmount[]) => {
    setIsDirty(true);
    try {
      if (getDraftKey) sessionStorage.setItem(getDraftKey, JSON.stringify({ rows: nextRows }));
    } catch {}
  };

  // Note: Do not sync rows from props after mount.
  // Rows are sourced from the component's local fetch to avoid clobbering unsaved or just-saved data.

  // Locally fetch reporting data for this component only (decoupled from global store)
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const weekInfo = getWeekInfo(selectedDate);
        const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
        const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');
        // Determine effective user id (admins may operate on a selected user)
        const effectiveUserId = user?.role === 'ADMIN' ? (selectedUserId || user?._id) : user?._id;
        if (!effectiveUserId) return;

        const weekKey = `${effectiveUserId}:${startDate}`;

        const resp = await fetchReportingData(effectiveUserId, startDate, endDate, 'weekly');
        const payload = resp?.data?.data;
        const actualArray = Array.isArray(payload?.actual) ? payload.actual : (payload?.actual ? [payload.actual] : []);
        const actual = actualArray && actualArray.length > 0 ? actualArray[0] : null;

        const preserved: Record<string, any> = {};
        if (actual) {
          Object.keys(actual).forEach((key) => {
            if (
              key !== 'adNamesAmount' &&
              key !== 'userId' &&
              key !== '_id' &&
              key !== 'createdAt' &&
              key !== 'updatedAt' &&
              key !== '__v' &&
              key !== 'startDate' &&
              key !== 'endDate'
            ) {
              preserved[key] = actual[key];
            }
          });
        }
        setExistingFields(preserved);

        const fetchedRows: AdNameAmount[] = actual && Array.isArray(actual.adNamesAmount) ? actual.adNamesAmount : [];

        // Prefer any draft first (draft means user has unsaved changes for this week)
        if (getDraftKey) {
          const draftStr = sessionStorage.getItem(getDraftKey);
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr);
              if (Array.isArray(draft?.rows)) {
                const appliedRows = draft.rows.length > 0 ? draft.rows : [{ adName: '', budget: 0 }];
                setRows(appliedRows);
                setIsDirty(true);
                return;
              }
            } catch {}
          }
        }

        // If current week has values, use them
        if (fetchedRows.length > 0) {
          setRows(fetchedRows);
          setIsDirty(false);
          return;
        }

        // Carry-forward on navigation for CURRENT + FUTURE weeks only (avoid backfilling past weeks)
        const currentWeekInfo = getCurrentWeek();
        if (isBefore(weekInfo.weekStart, currentWeekInfo.weekStart)) {
          setRows([{ adName: '', budget: 0 }]);
          setIsDirty(false);
          return;
        }

        // Current week is empty -> pull last week's values (carry-forward on load)
        const prevWeekStart = subDays(weekInfo.weekStart, 7);
        const prevWeekInfo = getWeekInfo(prevWeekStart);
        const prevStartDate = format(prevWeekInfo.weekStart, 'yyyy-MM-dd');
        const prevEndDate = format(prevWeekInfo.weekEnd, 'yyyy-MM-dd');

        const prevResp = await fetchReportingData(effectiveUserId, prevStartDate, prevEndDate, 'weekly');
        const prevPayload = prevResp?.data?.data;
        const prevActualArray = Array.isArray(prevPayload?.actual) ? prevPayload.actual : (prevPayload?.actual ? [prevPayload.actual] : []);
        const prevActual = prevActualArray && prevActualArray.length > 0 ? prevActualArray[0] : null;
        const prevRows: AdNameAmount[] = prevActual && Array.isArray(prevActual.adNamesAmount) ? prevActual.adNamesAmount : [];

        if (prevRows.length > 0) {
          setRows(prevRows);
          setIsDirty(false);

          // Persist the carry-forward once per week/user so it exists even if user never clicks Save.
          if (!autoPropagatedKeysRef.current.has(weekKey)) {
            autoPropagatedKeysRef.current.add(weekKey);
            try {
              await saveReportingData({
                userId: effectiveUserId,
                startDate,
                endDate,
                ...preserved,
                adNamesAmount: prevRows,
              });
            } catch {
              // Silent fail: carry-forward still shows in UI
            }
          }

          return;
        }

        // Nothing to carry forward; keep default row
        setRows([{ adName: '', budget: 0 }]);
        setIsDirty(false);
      } catch {
        // ignore fetch errors to avoid breaking UI
      } finally {
        setIsLoading(false);
      }
    };
    if (canView) load();
  }, [canView, selectedDate, selectedUserId, user?.role, user?._id, getDraftKey]);

  const totals = useMemo(() => {
    const dailyBudget = (weeklyBudget || 0) / 7;
    const safeRows = Array.isArray(rows) ? rows : [];
    const dailyBudgetInMarket = safeRows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
    const dailyBudgetLeft = dailyBudget - dailyBudgetInMarket;
    return { dailyBudget, dailyBudgetInMarket, dailyBudgetLeft };
  }, [rows, weeklyBudget]);

  // Don't render if user can't view
  if (!canView) {
    return null;
  }

  const handleRowChange = (index: number, key: keyof AdNameAmount, value: string) => {
    setRows(prev => {
      const base = Array.isArray(prev) ? prev : [{ adName: '', budget: 0 }];
      const next = base.map((r, i) =>
        i === index
          ? {
              ...r,
              [key]: key === 'budget' ? (value === '' ? 0 : Number(value) || 0) : value,
            }
          : r
      );
      persistDraftRows(next);
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => {
      const next = Array.isArray(prev) ? [...prev, { adName: '', budget: 0 }] : [{ adName: '', budget: 0 }];
      persistDraftRows(next);
      return next;
    });
  };

  const removeRow = (index: number) => {
    if (!Array.isArray(rows)) return;
    const rowToDelete = rows[index];
    if (rowToDelete) {
      setDeletedRows(prev => [...prev, rowToDelete]);
      setRows(prev => {
        if (!Array.isArray(prev)) return [];
        const next = prev.filter((_, i) => i !== index);
        persistDraftRows(next);
        return next;
      });
    }
  };

  const handleUndo = () => {
    if (deletedRows.length > 0) {
      const rowToRestore = deletedRows[deletedRows.length - 1];
      setDeletedRows(prev => Array.isArray(prev) ? prev.slice(0, -1) : []);
      setRows(prev => {
        const next = Array.isArray(prev) ? [...prev, rowToRestore] : [rowToRestore];
        persistDraftRows(next);
        return next;
      });
      toast({
        title: "Undone",
        description: "Deleted row restored",
      });
    }
  };

  const handleSave = async () => {
    const weekInfo = getWeekInfo(selectedDate);
    const safeRows = Array.isArray(rows) ? rows : [];
    const adNamesAmount = safeRows
      .filter(r => r.adName.trim().length > 0)
      .map(r => ({ adName: r.adName.trim(), budget: Number(r.budget) || 0 }));

    const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
    const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');

    setIsLoading(true);
    try {
      // Resolve effective user id
      const effectiveUserId = user?.role === 'ADMIN' ? (selectedUserId || user?._id) : user?._id;
      if (!effectiveUserId) throw new Error('No user id');

      // Save ONLY current selected week
      const currentWeekPayload = {
        startDate,
        endDate,
        ...(existingFields || {}),
        adNamesAmount,
      } as any;
      await saveReportingData({ ...currentWeekPayload, userId: effectiveUserId });

      // Also propagate to NEXT week (so when next week becomes current, it's already there)
      const nextWeekStart = addDays(weekInfo.weekStart, 7);
      const nextWeekInfo = getWeekInfo(nextWeekStart);
      const nextStartDate = format(nextWeekInfo.weekStart, 'yyyy-MM-dd');
      const nextEndDate = format(nextWeekInfo.weekEnd, 'yyyy-MM-dd');

      try {
        // Preserve any next-week fields (if present) so we don't accidentally wipe them.
        const nextResp = await fetchReportingData(effectiveUserId, nextStartDate, nextEndDate, 'weekly');
        const nextPayload = nextResp?.data?.data;
        const nextActualArray = Array.isArray(nextPayload?.actual) ? nextPayload.actual : (nextPayload?.actual ? [nextPayload.actual] : []);
        const nextActual = nextActualArray && nextActualArray.length > 0 ? nextActualArray[0] : null;
        const nextPreserved = extractPreservedFields(nextActual);

        await saveReportingData({
          userId: effectiveUserId,
          startDate: nextStartDate,
          endDate: nextEndDate,
          ...nextPreserved,
          adNamesAmount,
        });
      } catch {
        // Silent fail: we still saved the current week successfully
      }
      
      // Immediately update local state with saved data (optimistic update)
      setRows(adNamesAmount.length > 0 ? adNamesAmount : [{ adName: '', budget: 0 }]);
      setIsDirty(false);
      
      // Clear draft after successful save
      try {
        const draftKey = `dailyBudgetDraft:${effectiveUserId}:${startDate}`;
        sessionStorage.removeItem(draftKey);
      } catch {}
      
      // Wait a bit then refetch to sync with server (ensures API has processed)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Locally refetch to update this component state only (decoupled from global store)
      try {
        const resp = await fetchReportingData(effectiveUserId, startDate, endDate, 'weekly');
        const payload = resp?.data?.data;
        const actualArray = Array.isArray(payload?.actual) ? payload.actual : (payload?.actual ? [payload.actual] : []);
        const actual = actualArray && actualArray.length > 0 ? actualArray[0] : null;
        if (actual) {
          const fetchedRows: AdNameAmount[] = Array.isArray(actual.adNamesAmount) ? actual.adNamesAmount : [];
          // Only update if we got data back (use saved data if fetch fails)
          if (fetchedRows.length > 0 || adNamesAmount.length === 0) {
            setRows(fetchedRows.length > 0 ? fetchedRows : [{ adName: '', budget: 0 }]);
          }
          const preserved: Record<string, any> = {};
          Object.keys(actual).forEach((key) => {
            if (
              key !== 'adNamesAmount' &&
              key !== 'userId' &&
              key !== '_id' &&
              key !== 'createdAt' &&
              key !== 'updatedAt' &&
              key !== '__v' &&
              key !== 'startDate' &&
              key !== 'endDate'
            ) {
              preserved[key] = actual[key];
            }
          });
          setExistingFields(preserved);
        }
      } catch {
        // If refetch fails, keep the optimistic update (data we just saved)
      }
      
      toast({
        title: "✅ Saved Successfully",
        description: "Data saved for this week and copied to next week",
      });
    } catch (error) {
      toast({
        title: "❌ Error Saving",
        description: "Failed to save data",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
      <FullScreenLoader isLoading={isLoading} message="Updating campaign costs..." />
      {/* 1/3 - Daily Budget Handling card */}
      <Card className="bg-card/90 backdrop-blur-sm border border-border/20 shadow-xl h-full min-h-[360px]">
        <div className="p-6 border-b border-border/50 bg-gradient-secondary/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gradient-primary">Daily Budget Handling</h2>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="p-3 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-card-foreground">Daily Budget</div>
                <div className="text-[10px] text-muted-foreground">Weekly ÷ 7</div>
              </div>
              <div className="text-base font-semibold text-card-foreground">{currency.format(totals.dailyBudget)}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-card-foreground">Daily Budget In Market</div>
                {/* <div className="text-[10px] text-muted-foreground">Sum of ad amounts</div> */}
              </div>
              <div className="text-base font-semibold text-card-foreground">{currency.format(totals.dailyBudgetInMarket)}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-card-foreground">Daily Budget Left</div>
                <div className="text-[10px] text-muted-foreground">Daily − In Market</div>
              </div>
              <div className={`text-base font-semibold ${totals.dailyBudgetLeft < 0 ? 'text-red-600' : 'text-card-foreground'}`}>{currency.format(totals.dailyBudgetLeft)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2/3 - Ads Costs card */}
      <div className="xl:col-span-2">
        <Card className="bg-card/90 backdrop-blur-sm border border-border/20 shadow-xl h-full min-h-[360px]">
          <div className="p-6 border-b border-border/50 bg-gradient-secondary/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gradient-primary">Campaign Budget Planner</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleUndo} 
                  disabled={!canEdit || deletedRows.length === 0}
                  title={deletedRows.length === 0 ? "No deleted rows to restore" : "Restore last deleted row"}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={addRow}
                  disabled={!canEdit}
                >
                  Add Row
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!canEdit || !isDirty}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-3 pb-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-7">Campaign Name / Adset Name</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-2"></div>
            </div>

            {(!Array.isArray(rows) || rows.length === 0) && (
              <div className="text-sm text-muted-foreground py-4">No ads added. Click "Add Row" to start.</div>
            )}

            {Array.isArray(rows) && rows.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center py-2">
                <div className="col-span-7">
                  <Input
                    value={row.adName}
                    onChange={e => handleRowChange(index, 'adName', e.target.value)}
                    placeholder="Campaign Name / Adset Name"
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={row.budget === 0 ? '' : row.budget}
                    onChange={e => handleRowChange(index, 'budget', e.target.value)}
                    min={0}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeRow(index)}
                    title="Remove row"
                    className="text-red-600 hover:text-red-600 hover:bg-black/5"
                    disabled={!canEdit}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DailyBudgetManager;


