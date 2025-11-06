import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { getWeekInfo } from '@/utils/weekLogic';
import { Undo2, Trash2 } from 'lucide-react';

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

export const DailyBudgetManager: React.FC<DailyBudgetManagerProps> = ({
  selectedDate,
  weeklyBudget,
  initialAdNamesAmount = [],
}) => {
  const [rows, setRows] = useState<AdNameAmount[]>(
    initialAdNamesAmount.length > 0
      ? initialAdNamesAmount
      : [{ adName: '', budget: 0 }]
  );
  const [undoHistory, setUndoHistory] = useState<AdNameAmount[][]>([]);
  const { toast } = useToast();

  // Sync rows when week changes or incoming data updates
  useEffect(() => {
    const newRows = initialAdNamesAmount && initialAdNamesAmount.length > 0
      ? initialAdNamesAmount
      : [{ adName: '', budget: 0 }];
    setRows(newRows);
    // Clear undo history when week changes
    setUndoHistory([]);
  }, [selectedDate, initialAdNamesAmount]);

  const { upsertReportingData } = useReportingDataStore();

  // Save current state to undo history
  const saveToUndoHistory = (currentRows: AdNameAmount[]) => {
    setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(currentRows))]);
  };

  const totals = useMemo(() => {
    const dailyBudget = (weeklyBudget || 0) / 7;
    const dailyBudgetInMarket = rows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
    const dailyBudgetLeft = dailyBudget - dailyBudgetInMarket;
    return { dailyBudget, dailyBudgetInMarket, dailyBudgetLeft };
  }, [rows, weeklyBudget]);

  const handleRowChange = (index: number, key: keyof AdNameAmount, value: string) => {
    setRows(prev =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              [key]: key === 'budget' ? Number(value || 0) : value,
            }
          : r
      )
    );
  };

  const addRow = () => {
    saveToUndoHistory(rows);
    setRows(prev => [...prev, { adName: '', budget: 0 }]);
  };

  const removeRow = (index: number) => {
    saveToUndoHistory(rows);
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUndo = () => {
    if (undoHistory.length > 0) {
      const previousState = undoHistory[undoHistory.length - 1];
      setUndoHistory(prev => prev.slice(0, -1));
      setRows(previousState);
      toast({
        title: "Undone",
        description: "Previous state restored",
      });
    }
  };

  const handleSave = async () => {
    const weekInfo = getWeekInfo(selectedDate);
    const adNamesAmount = rows
      .filter(r => r.adName.trim().length > 0)
      .map(r => ({ adName: r.adName.trim(), budget: Number(r.budget) || 0 }));

    // Current week payload
    const currentWeekPayload = {
      startDate: format(weekInfo.weekStart, 'yyyy-MM-dd'),
      endDate: format(weekInfo.weekEnd, 'yyyy-MM-dd'),
      adNamesAmount,
    } as any;

    // Next week payload
    const nextWeekStart = addDays(weekInfo.weekStart, 7);
    const nextWeekEnd = addDays(weekInfo.weekEnd, 7);
    const nextWeekInfo = getWeekInfo(nextWeekStart);
    const nextWeekPayload = {
      startDate: format(nextWeekInfo.weekStart, 'yyyy-MM-dd'),
      endDate: format(nextWeekInfo.weekEnd, 'yyyy-MM-dd'),
      adNamesAmount,
    } as any;

    try {
      // Save current week
      await upsertReportingData(currentWeekPayload);
      
      // Save next week
      await upsertReportingData(nextWeekPayload);
      
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
                <div className="text-[10px] text-muted-foreground">Sum of ad amounts</div>
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
              <h2 className="text-lg font-semibold text-gradient-primary">Ads Costs</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleUndo} 
                  disabled={undoHistory.length === 0}
                  title={undoHistory.length === 0 ? "No actions to undo" : "Undo last action"}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button variant="secondary" onClick={addRow}>Add Row</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-3 pb-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-7">Ad Name</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-2"></div>
            </div>

            {rows.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">No ads added. Click "Add Row" to start.</div>
            )}

            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center py-2">
                <div className="col-span-7">
                  <Input
                    value={row.adName}
                    onChange={e => handleRowChange(index, 'adName', e.target.value)}
                    placeholder="Ad name"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={row.budget}
                    onChange={e => handleRowChange(index, 'budget', e.target.value)}
                    min={0}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => removeRow(index)}
                    title="Remove row"
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


