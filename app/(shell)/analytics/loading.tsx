export default function AnalyticsLoading() {
  return (
    <div className="space-y-5 animate-pulse">

      {/* Header skeleton */}
      <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-5 w-32 rounded-full bg-[#eaf3ed]" />
            <div className="h-9 w-64 rounded-lg bg-[#f0f1eb]" />
            <div className="h-4 w-96 rounded bg-[#f0f1eb]" />
          </div>
          <div className="grid min-w-[320px] grid-cols-3 gap-3 rounded-xl border border-[#1f2528]/10 bg-[#f9faf7] p-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-[#e8e9e3]" />
                <div className="h-7 w-10 rounded-lg bg-[#e0e1db]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1f2528]/10 bg-white p-4 shadow-[0_10px_32px_rgba(31,37,40,0.06)]"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#f0f1eb]" />
              <div className="h-4 w-4 rounded-full bg-[#f0f1eb]" />
            </div>
            <div className="mt-4 h-3 w-24 rounded bg-[#f0f1eb]" />
            <div className="mt-2 h-7 w-16 rounded-lg bg-[#e8e9e3]" />
            <div className="mt-2 h-3 w-32 rounded bg-[#f0f1eb]" />
          </div>
        ))}
      </div>

      {/* Bar + Pie chart row skeleton */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
          <div className="mb-5 space-y-2">
            <div className="h-3 w-36 rounded bg-[#f0f1eb]" />
            <div className="h-6 w-72 rounded-lg bg-[#e8e9e3]" />
          </div>
          {/* Bar chart placeholder */}
          <div className="flex items-end gap-4 px-4" style={{ height: 260 }}>
            {[70, 40, 90, 55, 30, 75].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-[#f0f1eb]"
                  style={{ height: `${h}%` }}
                />
                <div className="h-2.5 w-10 rounded bg-[#f0f1eb]" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-14 rounded bg-[#f0f1eb]" />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
          <div className="mb-4 space-y-2">
            <div className="h-3 w-24 rounded bg-[#f0f1eb]" />
            <div className="h-6 w-40 rounded-lg bg-[#e8e9e3]" />
          </div>
          {/* Donut placeholder */}
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="h-36 w-36 rounded-full border-[16px] border-[#f0f1eb] bg-white" />
          </div>
          <div className="mt-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-[#f0f1eb]" />
                <div className="h-3 w-6 rounded bg-[#f0f1eb]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line chart skeleton */}
      <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
        <div className="mb-5 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-[#f0f1eb]" />
            <div className="h-6 w-64 rounded-lg bg-[#e8e9e3]" />
            <div className="h-3 w-56 rounded bg-[#f0f1eb]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-[#f0f1eb]" />
        </div>
        {/* Line chart placeholder — horizontal lines mimicking a chart */}
        <div className="relative overflow-hidden rounded-lg bg-[#f9faf7]" style={{ height: 240 }}>
          {[20, 40, 60, 80].map((top, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-[#eaeae5]"
              style={{ top: `${top}%` }}
            />
          ))}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <polyline
              points="0,180 120,80 240,130 360,60 480,110 600,50 720,90 840,70"
              fill="none"
              stroke="#e8e9e3"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="0,200 120,140 240,170 360,120 480,150 600,100 720,130 840,110"
              fill="none"
              stroke="#eeeff0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="mt-4 flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 w-14 rounded bg-[#f0f1eb]" />
          ))}
        </div>
      </div>

      {/* Bottom row skeleton */}
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Platform table */}
        <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-[#f0f1eb]" />
              <div className="h-6 w-48 rounded-lg bg-[#e8e9e3]" />
            </div>
            <div className="h-6 w-24 rounded-full bg-[#f0f1eb]" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1f2528]/10 bg-[#fbfcf8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded bg-[#e8e9e3]" />
                    <div className="h-3 w-32 rounded bg-[#f0f1eb]" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-14 rounded-full bg-[#f0f1eb]" />
                    <div className="h-5 w-20 rounded-full bg-[#f0f1eb]" />
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#eeefe9]" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3 w-full rounded bg-[#f0f1eb]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
            <div className="mb-4 space-y-2">
              <div className="h-3 w-20 rounded bg-[#f0f1eb]" />
              <div className="h-6 w-44 rounded-lg bg-[#e8e9e3]" />
            </div>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {[60, 90, 45, 70].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-[#f0f1eb]" style={{ height: `${h}%` }} />
                  <div className="h-2.5 w-10 rounded bg-[#f0f1eb]" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-36 rounded bg-[#e8e9e3]" />
              <div className="h-5 w-16 rounded-full bg-[#f0f1eb]" />
            </div>
            <div className="overflow-hidden rounded-xl border border-[#1f2528]/10">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#1f2528]/8 bg-white p-3 last:border-0">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-40 rounded bg-[#f0f1eb]" />
                    <div className="h-2.5 w-16 rounded bg-[#f5f5f0]" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-3 w-6 rounded bg-[#f0f1eb]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}