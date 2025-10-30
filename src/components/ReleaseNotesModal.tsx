import React from "react";
import { X } from "lucide-react";
import { RELEASE_NOTES } from "@/constants/releaseNotes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onMarkAsSeen: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({
  isOpen,
  onMarkAsSeen,
}) => {
  const latestRelease = RELEASE_NOTES[0];

  return (
    <Dialog open={isOpen} onOpenChange={onMarkAsSeen}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div>
            <DialogTitle className="text-2xl font-semibold">
              🎉 What's New in Revenue Pro
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest updates and improvements
            </p>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-6 max-h-[calc(85vh-200px)]">
          <div className="space-y-6">
            {/* Version Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Latest Update
              </div>
              <div className="text-sm text-muted-foreground">
                {latestRelease.date}
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                New Features & Improvements
              </h3>
              <div className="space-y-3">
                {latestRelease.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p
                      className="text-sm text-gray-700 leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                💡 You can always view the complete release history in the{" "}
                <a
                  href="/release-notes"
                  className="text-primary underline hover:no-underline font-medium"
                  onClick={onMarkAsSeen}
                >
                  Release Notes page
                </a>
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end gap-3">
          <Button onClick={onMarkAsSeen} className="min-w-[100px]">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
