import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { format } from 'date-fns';
import { getWeekInfo, getWeeksInMonth } from '@/utils/weekLogic';

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

  // Sync rows when week changes or incoming data updates
  useEffect(() => {
    setRows(
      initialAdNamesAmount && initialAdNamesAmount.length > 0
        ? initialAdNamesAmount
        : [{ adName: '', budget: 0 }]
    );
  }, [selectedDate, initialAdNamesAmount]);

  const { upsertReportingData } = useReportingDataStore();

  const totals = useMemo(() => {
    const weekInfo = getWeekInfo(selectedDate);
    const weeksInMonth = getWeeksInMonth(weekInfo.belongsToYear, weekInfo.belongsToMonth).length || 1;
    const dailyBudget = (weeklyBudget || 0) / weeksInMonth;
    const dailyBudgetInMarket = rows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
    const dailyBudgetLeft = dailyBudget - dailyBudgetInMarket;
    return { dailyBudget, dailyBudgetInMarket, dailyBudgetLeft, weeksInMonth } as any;
  }, [rows, weeklyBudget, selectedDate]);

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

  const addRow = () => setRows(prev => [...prev, { adName: '', budget: 0 }]);
  const removeRow = (index: number) =>
    setRows(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const weekInfo = getWeekInfo(selectedDate);
    const payload = {
      startDate: format(weekInfo.weekStart, 'yyyy-MM-dd'),
      endDate: format(weekInfo.weekEnd, 'yyyy-MM-dd'),
      adNamesAmount: rows
        .filter(r => r.adName.trim().length > 0)
        .map(r => ({ adName: r.adName.trim(), budget: Number(r.budget) || 0 })),
    } as any;

    await upsertReportingData(payload);
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
                <div className="text-[10px] text-muted-foreground">Weekly ÷ Weeks in Month ({totals.weeksInMonth})</div>
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
                <Button variant="outline" onClick={() => setRows([])}>Clear All</Button>
                <Button variant="secondary" onClick={addRow}>Add Row</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-3 pb-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-7">Ad Name</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-2">Actions</div>
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
                  <Button variant="destructive" onClick={() => removeRow(index)}>
                    Remove
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


