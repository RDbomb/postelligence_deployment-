import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let baseStyle = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  let variantStyles = {
    default: "border-[#2f7867]/15 bg-[#eaf7ef] text-[#2f7867]",
    secondary: "border-transparent bg-slate-100 text-slate-800",
    destructive: "border-transparent bg-red-500 text-white",
    outline: "text-slate-800 border-slate-200"
  };

  const finalClassName = `${baseStyle} ${variantStyles[variant]} ${className}`;

  return <div className={finalClassName} {...props} />;
}
