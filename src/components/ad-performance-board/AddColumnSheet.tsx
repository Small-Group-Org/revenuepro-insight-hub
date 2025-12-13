import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ColumnConfig, GroupBy } from "@/types/adPerformanceBoard";
import { useEffect, useMemo, useState } from "react";

interface AddColumnSheetProps {
  open: boolean;
  availableColumns: ColumnConfig[];
  selectedColumnIds: string[];
  groupBy?: GroupBy;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

export const AddColumnSheet = ({
  open,
  availableColumns,
  selectedColumnIds,
  groupBy,
  onClose,
  onAdd,
}: AddColumnSheetProps) => {
  const getGroupByLabel = (gb?: GroupBy) => {
    if (!gb) return "";
    return gb === "campaign" ? "Campaign" : gb === "adset" ? "Ad Set" : "Ad";
  };
  const dimensionIds = ["campaignName", "adSetName", "adName"];
  const [query, setQuery] = useState("");
  const [localSelection, setLocalSelection] =
    useState<string[]>(selectedColumnIds);

  useEffect(() => {
    setLocalSelection(selectedColumnIds);
  }, [selectedColumnIds]);

  const filtered = useMemo(() => {
    const list = query.trim()
      ? availableColumns.filter((col) =>
          col.label.toLowerCase().includes(query.toLowerCase())
        )
      : availableColumns;

    const grouped = list.reduce<Record<string, ColumnConfig[]>>((acc, col) => {
      const key = col.category || "Other";
      acc[key] = acc[key] ? [...acc[key], col] : [col];
      return acc;
    }, {});

    return grouped;
  }, [query, availableColumns]);

  const toggleSelection = (id: string) => {
    setLocalSelection((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const hasDimensionSelected = useMemo(
    () => localSelection.some((id) => dimensionIds.includes(id)),
    [localSelection]
  );

  const handleApply = () => {
    onAdd(localSelection);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search metrics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ScrollArea className="h-[420px] rounded-md border">
            <div className="p-3 space-y-4">
              {Object.keys(filtered).length === 0 ? (
                <p className="text-sm text-slate-500">
                  All available columns are already on the board.
                </p>
              ) : (
                Object.entries(filtered).map(([category, cols]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {category}
                      </p>
                      {category === "Dimensions" && !hasDimensionSelected && (
                        <span className="text-[11px] font-medium text-red-600">
                          Pick at least one
                        </span>
                      )}
                      {(category === "Leads" || category === "Lead KPIs") && groupBy && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Based on {getGroupByLabel(groupBy)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {cols.map((col) => (
                        <label
                          key={col.id}
                          className="flex items-start gap-3 rounded-md border px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={localSelection.includes(col.id)}
                            onCheckedChange={() => toggleSelection(col.id)}
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-tight">
                              {col.label}
                            </p>
                            {col.description && (
                              <p className="text-xs text-slate-500">
                                {col.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-slate-500">
            Selected {localSelection.length} columns
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!hasDimensionSelected}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

