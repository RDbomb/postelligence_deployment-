import * as React from "react";

export type GlassPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className = "", children, ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-[24px] border border-[#1f2528]/8 bg-white/50 backdrop-blur-md shadow-[0_8px_30px_rgba(31,37,40,0.03)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
