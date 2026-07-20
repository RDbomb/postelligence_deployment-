import Link from "next/link";
import { AtSign, Briefcase, Camera, PlaySquare } from "lucide-react";
import { BrandMark } from "@/components/marketing/BrandMark";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Integrations", href: "/platforms" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/login" }
    ]
  },
  {
    title: "Platforms",
    links: [
      { label: "LinkedIn", href: "/platforms" },
      { label: "Instagram", href: "/platforms" },
      { label: "YouTube", href: "/platforms" },
      { label: "Threads & Bluesky", href: "/platforms" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="px-5 pb-10 pt-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[28px] border border-[#1f2528]/8 bg-white/70 p-8 backdrop-blur-xl md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div>
              <BrandMark size="md" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#627078]">
                The calm, intelligent workspace for creators who refuse to repeat themselves.
              </p>
              <div className="mt-6 flex items-center gap-2">
                {[AtSign, Briefcase, Camera, PlaySquare].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1f2528]/10 text-[#5a656c] transition hover:border-[#2f7867]/30 hover:text-[#2f7867]"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#1f2528]">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#627078] transition hover:text-[#1f2528]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#1f2528]/8 pt-6 text-xs text-[#7c878d] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Postelligence. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="#" className="hover:text-[#1f2528]">
                Privacy
              </Link>
              <Link href="#" className="hover:text-[#1f2528]">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
