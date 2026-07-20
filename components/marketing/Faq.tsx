"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Which platforms can I publish to?",
    a: "LinkedIn, Instagram, YouTube, Threads, Bluesky, Pinterest, and Reddit are all supported today, with new platforms added regularly based on creator demand."
  },
  {
    q: "Does the AI actually understand my brand voice?",
    a: "AI Studio learns from the content you've already published and the edits you make, so suggestions get sharper the more you use it — never generic, always grounded in how you actually write."
  },
  {
    q: "Can I schedule posts in advance for every time zone?",
    a: "Yes. The visual calendar lets you plan a full week or month ahead, and Postelligence handles time zone conversion automatically so posts land exactly when your audience is active."
  },
  {
    q: "Is there a limit on connected accounts?",
    a: "Starter includes two connected accounts. Pro and Team plans include unlimited connections across every supported platform."
  },
  {
    q: "How does Postelligence keep my accounts secure?",
    a: "Every connection uses native OAuth — Postelligence never stores your passwords. Sessions are encrypted end to end and you can revoke access at any time from Settings."
  }
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-[#1f2528]/8 rounded-[28px] border border-[#1f2528]/8 bg-white/70 backdrop-blur-xl">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.q} className="px-6 md:px-8">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-[0.98rem] font-semibold text-[#1f2528] md:text-base">
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25 }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f2528]/[0.06] text-[#1f2528]"
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-[0.92rem] leading-relaxed text-[#627078]">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
