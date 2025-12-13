import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColumnConfig, PerformanceRow } from "@/types/adPerformanceBoard";
import {
  formatCellValue,
  getAggregateValue,
} from "@/components/ad-performance-board/columnConfig";
import {
  GripVertical,
  Settings,
  X,
} from "lucide-react";
import { type DragEvent } from "react";

interface ColumnCardProps {
  column: ColumnConfig;
  data: PerformanceRow[];
  isDragging?: boolean;
  onRemove: (id: string) => void;
  onOpenSettings: (column: ColumnConfig) => void;
  dragHandleProps: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
}

export const ColumnCard = ({
  column,
  data,
  isDragging,
  onRemove,
  onOpenSettings,
  dragHandleProps,
}: ColumnCardProps) => {
  return (
    <Card
      className={cn(
        "min-w-[240px] flex flex-col border border-slate-200/80 shadow-sm",
        isDragging && "opacity-70 ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
        <div
          className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-grab"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
          <span>{column.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onOpenSettings(column)}
          >
            <Settings className="h-4 w-4 text-slate-700" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onRemove(column.id)}
          >
            <X className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <div className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <div
              key={row.id ?? `${column.id}-${idx}`}
              className="px-3 py-2 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {formatCellValue(column, row[column.apiField])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {column.aggregate && column.aggregate !== "none" && (
        <div className="px-3 py-2 border-t bg-slate-50 text-sm font-semibold text-slate-700">
          Σ {getAggregateValue(column, data)}
        </div>
      )}
    </Card>
  );
};

