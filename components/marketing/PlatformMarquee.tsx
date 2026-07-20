const platforms = [
  "LinkedIn",
  "Instagram",
  "YouTube",
  "Threads",
  "Bluesky",
  "Pinterest",
  "Reddit",
  "X / Twitter"
];

export function PlatformMarquee() {
  const loop = [...platforms, ...platforms];
  return (
    <div className="relative overflow-hidden py-2" style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
      <div className="marquee-track flex w-max items-center gap-3">
        {loop.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-[#1f2528]/8 bg-white/70 px-4 py-2 text-[0.85rem] font-semibold text-[#3a444a]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2f7867]" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
