"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/marketing/PageTransition";
import { PricingVisual } from "@/components/marketing/PricingVisual";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for solo creators testing the waters.",
    cta: "Get started",
    featured: false,
    features: [
      "2 connected accounts",
      "10 scheduled posts / month",
      "AI caption assist",
      "Basic analytics",
      "Media library (1 GB)"
    ]
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For creators who publish consistently and want full power.",
    cta: "Start free trial",
    featured: true,
    features: [
      "Unlimited connected accounts",
      "Unlimited scheduled posts",
      "Full AI Studio access",
      "Advanced analytics",
      "Media library (50 GB)",
      "Priority support"
    ]
  },
  {
    name: "Team",
    price: "$49",
    period: "per month",
    description: "Built for agencies and teams managing multiple brands.",
    cta: "Contact sales",
    featured: false,
    features: [
      "Everything in Pro",
      "5 team seats included",
      "Shared content calendar",
      "Approval workflows",
      "Brand workspaces",
      "Dedicated onboarding"
    ]
  }
];

export default function PricingPage() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <PageTransition>
      <section className="marketing-page-hero px-5 pb-10 pt-12 md:px-8 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="marketing-eyebrow">Pricing</p>
            <h1 className="marketing-display mt-5 max-w-4xl">
              Simple plans.
              <br />
              Serious results.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#4f5b62]">
              Start free. Upgrade when you&apos;re ready. No hidden fees, no surprise limits on the
              features that matter most.
            </p>
          </div>
          <div className="perspective-1000 hidden lg:block">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-full"
            >
              <PricingVisual />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8 md:pb-32">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[28px]"
            >
              <article
                className={
                  plan.featured 
                    ? "marketing-pricing-card marketing-pricing-card-featured h-full relative z-20" 
                    : "marketing-pricing-card h-full relative z-20"
                }
              >
                {plan.featured ? (
                  <span className="marketing-pricing-badge">Most popular</span>
                ) : null}

                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1f2528]">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#627078]">{plan.description}</p>
                </div>

                <div className="mt-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-semibold tracking-[-0.05em] text-[#1f2528]">
                      {plan.price}
                    </span>
                    {plan.price !== "Free" ? (
                      <span className="mb-2 text-sm text-[#627078]">/{plan.period.split(" ")[1]}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#7b858d]">{plan.period}</p>
                </div>

                <Link
                  href="/login"
                  className={
                    plan.featured
                      ? "marketing-cta-primary mt-8 w-full justify-center"
                      : "marketing-cta-secondary mt-8 w-full justify-center border border-[#1f2528]/10 bg-white"
                  }
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[0.92rem] text-[#4f5b62]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7867]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-[#7b858d]">
          All plans include secure OAuth connections, encrypted sessions, and access to our core
          publishing engine. Cancel anytime.
        </p>
      </section>
    </PageTransition>
  );
}
