import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, FileText } from "lucide-react";
import {
  RELEASE_NOTES,
  LAST_UPDATED,
  COMPANY_NAME,
  PAGE_TITLE,
} from "@/constants/releaseNotes";

const ReleaseNotes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Brand Header */}
      <div className="bg-primary text-primary-foreground h-[100px]">
        <div className="max-w-7xl h-full flex items-center px-8">
          <button onClick={() => navigate("/")} aria-label="Go to home" className="inline-flex items-center">
            <img src="/logo.png" alt="Company logo" className="h-10 w-auto" />
          </button>
        </div>
      </div>
      <div className="relative z-10 pt-4 pb-12 px-4 mt-12">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                {PAGE_TITLE}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10 mt-2">
              Stay updated with the latest features, improvements, and bug fixes
            </p>
          </div>

          {/* Last Updated Badge */}
          <div className="flex justify-center">
            <span className="bg-gradient-to-br from-background via-muted/15 to-primary/3 text-muted-foreground px-6 py-2.5 rounded-lg text-xs font-medium tracking-wide shadow-lg border border-border hover:scale-105 transition-transform duration-300 cursor-default flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              LAST UPDATED: {LAST_UPDATED}
            </span>
          </div>

          {/* Release Notes */}
          <div className="max-w-5xl mx-auto space-y-6">
            {RELEASE_NOTES.map((release, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-background via-muted/15 to-primary/3 rounded-xl p-8 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-1 h-12 bg-gradient-to-b from-primary to-primary/40 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-md"></div>
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                    {release.date}
                  </h2>
                </div>

                <div className="space-y-3 pl-8">
                  {release.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-start gap-3 text-muted-foreground text-base leading-relaxed group-hover:text-foreground transition-colors duration-300"
                    >
                      <span className="text-primary/60 mt-1.5 text-xs group-hover:text-primary transition-colors duration-300">
                        ●
                      </span>
                      <p
                        className="flex-1"
                        dangerouslySetInnerHTML={{ __html: item }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Minimal Footer Text */}
          <div className="text-center pt-12">
            <p className="text-muted-foreground text-sm font-light">
              &copy; 2025 {COMPANY_NAME}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotes;
