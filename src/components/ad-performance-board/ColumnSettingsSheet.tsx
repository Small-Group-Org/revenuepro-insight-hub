import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ColumnConfig } from "@/types/adPerformanceBoard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ColumnSettingsSheetProps {
  open: boolean;
  column: ColumnConfig | null;
  sortDirection: "asc" | "desc" | null;
  onClose: () => void;
  onSave: (config: ColumnConfig, sortDirection: "asc" | "desc" | null) => void;
}

export const ColumnSettingsSheet = ({
  open,
  column,
  sortDirection,
  onClose,
  onSave,
}: ColumnSettingsSheetProps) => {
  const [decimals, setDecimals] = useState<number | undefined>(column?.decimals);
  const [localSort, setLocalSort] = useState<"asc" | "desc" | null>(
    sortDirection
  );

  useEffect(() => {
    setDecimals(column?.decimals);
  }, [column]);

  useEffect(() => {
    setLocalSort(sortDirection);
  }, [sortDirection]);

  if (!column) return null;

  const handleSave = () => {
    onSave(
      {
        ...column,
        decimals,
      },
      localSort
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Column settings: {column.label}</DialogTitle>
          <DialogDescription>
            Sorting and number formatting for this column.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sort</Label>
            <RadioGroup
              className="grid grid-cols-3 gap-2"
              value={localSort ?? "none"}
              onValueChange={(value) =>
                setLocalSort(value === "none" ? null : (value as "asc" | "desc"))
              }
            >
              <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                <RadioGroupItem value="desc" id="sort-desc" />
                <Label htmlFor="sort-desc">Desc</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                <RadioGroupItem value="asc" id="sort-asc" />
                <Label htmlFor="sort-asc">Asc</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                <RadioGroupItem value="none" id="sort-none" />
                <Label htmlFor="sort-none">None</Label>
              </div>
            </RadioGroup>
          </div>

          {(column.type === "currency" ||
            column.type === "number" ||
            column.type === "percentage") && (
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                min={0}
                max={4}
                value={decimals ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setDecimals(undefined);
                    return;
                  }
                  const parsed = Number(value);
                  setDecimals(Number.isNaN(parsed) ? undefined : parsed);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

