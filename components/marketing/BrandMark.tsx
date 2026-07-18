type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
};

const sizes = {
  sm: { box: 28, radius: 8, font: "0.78rem", text: "text-[0.95rem]" },
  md: { box: 34, radius: 10, font: "0.9rem", text: "text-[1.08rem]" },
  lg: { box: 44, radius: 13, font: "1.1rem", text: "text-[1.35rem]" }
};

export function BrandMark({ size = "md", hideText = false }: BrandMarkProps) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
        style={{
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          background: "linear-gradient(145deg, #2f7867 0%, #1f2528 130%)"
        }}
      >
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="2.6" fill="#f6f7f1" />
          <circle cx="18" cy="6" r="2.6" fill="#f6f7f1" fillOpacity="0.55" />
          <circle cx="6" cy="18" r="2.6" fill="#f6f7f1" fillOpacity="0.55" />
          <circle cx="18" cy="18" r="2.6" fill="#f6f7f1" fillOpacity="0.85" />
          <path
            d="M6 6 L18 6 M6 6 L6 18 M18 6 L18 18 M6 18 L18 18"
            stroke="#f6f7f1"
            strokeOpacity="0.35"
            strokeWidth="1.1"
          />
        </svg>
      </span>
      {!hideText && (
        <span
          className={`font-semibold tracking-[-0.03em] text-[#1f2528] ${s.text}`}
          style={{ fontSize: s.font === "0.78rem" ? undefined : undefined }}
        >
          Postelligence
        </span>
      )}
    </span>
  );
}
