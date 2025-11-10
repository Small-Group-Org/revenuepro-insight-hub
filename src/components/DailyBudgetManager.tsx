import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { getWeekInfo } from '@/utils/weekLogic';
import { Undo2, Trash2 } from 'lucide-react';
import { useUserContext } from '@/utils/UserContext';

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

export const DailyBudgetManager: React.FC<DailyBudgetManagerProps> = ({
  selectedDate,
  weeklyBudget,
  initialAdNamesAmount = [],
}) => {
  const { user } = useUserContext();
  const [rows, setRows] = useState<AdNameAmount[]>(
    Array.isArray(initialAdNamesAmount) && initialAdNamesAmount.length > 0
      ? initialAdNamesAmount
      : [{ adName: '', budget: 0 }]
  );
  const [deletedRows, setDeletedRows] = useState<AdNameAmount[]>([]);
  const { toast } = useToast();
  const { upsertReportingData, reportingData, getReportingData } = useReportingDataStore();

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

  // Sync rows when week changes or incoming data updates
  useEffect(() => {
    const newRows = Array.isArray(initialAdNamesAmount) && initialAdNamesAmount.length > 0
      ? initialAdNamesAmount
      : [{ adName: '', budget: 0 }];
    setRows(newRows);
    // Clear deleted rows history when week changes
    setDeletedRows([]);
  }, [selectedDate, initialAdNamesAmount]);

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
      if (!Array.isArray(prev)) return [{ adName: '', budget: 0 }];
      return prev.map((r, i) =>
        i === index
          ? {
              ...r,
              [key]: key === 'budget' ? (value === '' ? 0 : Number(value) || 0) : value,
            }
          : r
      );
    });
  };

  const addRow = () => {
    setRows(prev => Array.isArray(prev) ? [...prev, { adName: '', budget: 0 }] : [{ adName: '', budget: 0 }]);
  };

  const removeRow = (index: number) => {
    if (!Array.isArray(rows)) return;
    const rowToDelete = rows[index];
    if (rowToDelete) {
      setDeletedRows(prev => [...prev, rowToDelete]);
      setRows(prev => Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []);
    }
  };

  const handleUndo = () => {
    if (deletedRows.length > 0) {
      const rowToRestore = deletedRows[deletedRows.length - 1];
      setDeletedRows(prev => Array.isArray(prev) ? prev.slice(0, -1) : []);
      setRows(prev => Array.isArray(prev) ? [...prev, rowToRestore] : [rowToRestore]);
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

    try {
      // Get existing reporting data to preserve all other fields
      const existingData = reportingData && reportingData[0] ? reportingData[0] : null;
      
      // Extract all existing fields except adNamesAmount and metadata
      const existingFields: any = {};
      if (existingData) {
        Object.keys(existingData).forEach(key => {
          if (key !== 'adNamesAmount' && 
              key !== 'userId' && 
              key !== '_id' && 
              key !== 'createdAt' && 
              key !== 'updatedAt' && 
              key !== '__v' &&
              key !== 'startDate' &&
              key !== 'endDate') {
            existingFields[key] = existingData[key];
          }
        });
      }

      // Current week payload - merge existing fields with new adNamesAmount
      const currentWeekPayload = {
        startDate: startDate,
        endDate: endDate,
        ...existingFields,
        adNamesAmount,
      } as any;

      // Next week payload - for next week, we only save adNamesAmount
      const nextWeekStart = addDays(weekInfo.weekStart, 7);
      const nextWeekEnd = addDays(weekInfo.weekEnd, 7);
      const nextWeekInfo = getWeekInfo(nextWeekStart);
      const nextWeekPayload = {
        startDate: format(nextWeekInfo.weekStart, 'yyyy-MM-dd'),
        endDate: format(nextWeekInfo.weekEnd, 'yyyy-MM-dd'),
        adNamesAmount,
      } as any;

      // Save current week
      await upsertReportingData(currentWeekPayload);
      
      // Save next week
      await upsertReportingData(nextWeekPayload);
      
      // Refetch reporting data to update the store with complete data from API
      await getReportingData(startDate, endDate, 'weekly', 'weekly');
      
      toast({
        title: "✅ Saved Successfully",
        description: "Data saved for current week and next week",
      });
    } catch (error) {
      toast({
        title: "❌ Error Saving",
        description: "Failed to save data",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
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
              <h2 className="text-lg font-semibold text-gradient-primary">Campaign Costs</h2>
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
                  disabled={!canEdit}
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


