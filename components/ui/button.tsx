import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer";
    
    const variantStyles = {
      default: "bg-[#1f2528] text-white hover:bg-[#2f7867]",
      primary: "bg-[#2f7867] text-white hover:bg-[#3a8b76]",
      danger: "bg-red-500 text-white hover:bg-red-600",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
      link: "text-[#2f7867] underline-offset-4 hover:underline"
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9"
    };

    const finalClassName = `${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={finalClassName}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
