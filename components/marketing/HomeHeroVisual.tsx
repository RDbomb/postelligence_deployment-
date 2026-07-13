"use client";

import { motion } from "framer-motion";
import { BrandMark } from "./BrandMark";

// Real Social Media Logos (Custom inline SVGs)
function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0077B5">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

// Custom real SVG logo for Instagram (uses gradient fill)
function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="url(#ig-grad-large)">
      <defs>
        <radialGradient id="ig-grad-large" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0 3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845a1.21 1.21 0 1 0 .001 2.42 1.21 1.21 0 0 0-.001-2.42z" />
    </svg>
  );
}

function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#FF0000">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function ThreadsLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#000000">
      <path d="M12.02 0c-3.15 0-5.84 1.05-7.79 3.04C2.28 5.03 1.25 7.73 1.25 10.9v.08c0 3.08 1 5.72 2.92 7.68 1.94 1.98 4.63 3.02 7.79 3.02a11.9 11.9 0 0 0 6.64-1.92l.14-.1c.36-.26.47-.73.28-1.12a.91.91 0 0 0-1.18-.43l-.12.08a10.05 10.05 0 0 1-5.76 1.66c-2.65 0-4.9-.86-6.52-2.5-1.57-1.6-2.38-3.79-2.38-6.33v-.08c0-2.61.8-4.83 2.37-6.42A9.77 9.77 0 0 1 12.02 1.83c2.66 0 4.9.84 6.5 2.45 1.58 1.58 2.4 3.75 2.4 6.3v1.8c0 1.2-.42 2.22-1.22 2.98-.8.76-1.84 1.15-3.04 1.15-1.1 0-2.07-.36-2.8-.97-.73-.62-1.14-1.55-1.18-2.67.63-.39 1.18-.94 1.58-1.62.4-.68.62-1.48.62-2.34 0-1.66-.54-3-1.6-3.87C12.22 7.15 10.74 6.7 9.02 6.7c-2.4 0-4.32 1.03-5.58 2.98A10.22 10.22 0 0 0 2.22 15c0 2.1.58 3.78 1.68 4.9a6.23 6.23 0 0 0 4.62 1.76c1.47 0 2.85-.36 4.02-1.07.38-.23.51-.72.3-1.1a.91.91 0 0 0-1.22-.3l-.06.03a4.7 4.7 0 0 1-3.04.83c-1.1 0-2-.36-2.6-.96-.64-.66-.98-1.68-.98-2.96 0-1.62.46-2.96 1.34-3.9 1-.94 2.34-1.43 3.86-1.43 1.1 0 2 .28 2.63.8.63.53.97 1.3.97 2.23V14c0 1.72.6 3.16 1.75 4.22C16.03 19.3 17.58 19.8 19.46 19.8c1.72 0 3.2-.56 4.34-1.65A6.09 6.09 0 0 0 25.4 13.8v-1.8c0-3.15-1.02-5.83-2.98-7.79C20.46 2.27 17.78 1.25 14.6 1.25c-.86 0-1.7.08-2.58.23l-.15.02c-.44.07-.74.47-.68.91a.91.91 0 0 0 .91.77c.8-.13 1.6-.2 2.5-.2 2.8 0 5.17.9 6.84 2.62a9.12 9.12 0 0 1 2.5 6.44v1.8c0 1.38-.43 2.52-1.25 3.33-.82.81-1.9 1.23-3.15 1.23-1.22 0-2.22-.43-2.9-1.24a5.05 5.05 0 0 1-.95-3.2v-1.8c0-1.13-.38-2.07-1.1-2.68a3.78 3.78 0 0 0-2.35-.9c-1.5 0-2.63.4-3.27 1.24a7 7 0 0 0-.96 3.7c0 1.34.34 2.45.98 3.23.64.78 1.54 1.17 2.62 1.17.87 0 1.62-.25 2.18-.72.2-.17.26-.47.12-.7a.9.9 0 0 0-1.18-.2c-.33.22-.72.32-1.14.32-.57 0-1.04-.2-1.37-.62a3.83 3.83 0 0 1-.5-2.26c0-1.74.48-2.9 1.4-3.38.45-.23.95-.35 1.48-.35.9 0 1.55.3 1.88.94.33.64.5 1.53.5 2.6v1.82z" />
    </svg>
  );
}

function BlueskyLogo() {
  return (
    <svg viewBox="0 0 512 512" className="h-8 w-8" fill="#0085ff">
      <path d="M111.8 62.2C170.2 105.9 233 189.7 256 230c23-40.3 85.8-124.1 144.2-167.8C447.8 26.9 512 16 512 16s-10.9 64.2-46.2 111.8c-43.7 58.4-127.5 121.2-167.8 144.2 40.3 23 124.1 85.8 167.8 144.2 35.3 47.6 46.2 111.8 46.2 111.8s-64.2-10.9-111.8-46.2c-58.4-43.7-121.2-127.5-144.2-167.8-23 40.3-85.8 124.1-144.2 167.8C64.2 485.1 16 496 16 496s10.9-64.2 46.2-111.8c43.7-58.4 127.5-121.2 167.8-144.2-40.3-23-124.1-85.8-167.8-144.2C26.9 127.8 16 63.6 16 63.6s47.8 11.2 95.8 47.6z" />
    </svg>
  );
}

function PinterestLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#BD081C">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.886 1.406-5.886s-.359-.722-.359-1.789c0-1.675.972-2.926 2.185-2.926 1.03 0 1.526.771 1.526 1.696 0 1.035-.658 2.585-.999 4.02-.283 1.2.603 2.18 1.784 2.18 2.143 0 3.791-2.261 3.791-5.524 0-2.887-2.076-4.908-5.04-4.908-3.433 0-5.449 2.572-5.449 5.234 0 1.037.4 2.146.9 2.753.1.12.115.228.085.349-.093.386-.299 1.209-.34 1.378-.053.223-.178.27-.41.163-1.529-.71-2.486-2.946-2.486-4.737 0-3.856 2.801-7.4 8.082-7.4 4.244 0 7.543 3.023 7.543 7.067 0 4.215-2.657 7.607-6.349 7.607-1.24 0-2.407-.645-2.806-1.406l-.762 2.906c-.276 1.052-1.022 2.37-1.522 3.187 1.125.347 2.316.537 3.551.537 6.621 0 11.986-5.37 11.986-11.988C24.014 5.367 18.647 0 12.017 0z" />
    </svg>
  );
}

function RedditLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#FF4500">
      <path d="M24 11.5c0-1.654-1.346-3-3-3-.964 0-1.817.458-2.36 1.16-1.625-1.122-3.826-1.822-6.242-1.9l1.322-4.148 4.31.916c.038.847.74 1.522 1.597 1.522 1.02 0 1.848-.828 1.848-1.848s-.828-1.848-1.848-1.848c-.89 0-1.626.634-1.796 1.48L12.44 2.82a.75.75 0 0 0-.904.512L10.05 7.6C7.59 7.663 5.347 8.37 3.694 9.508 3.155 8.796 2.28 8.333 1.25 8.333c-1.654 0-3 1.346-3 3 0 1.22.735 2.27 1.787 2.723-.058.26-.087.525-.087.79 0 3.738 4.544 6.786 10.15 6.786s10.15-3.048 10.15-6.786c0-.265-.03-.53-.088-.79 1.052-.453 1.788-1.503 1.788-2.723zm-16.5 2c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm10 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#000000">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function HomeHeroVisual() {
  const platforms = [
    { name: "LinkedIn", color: "#1d5b95", bg: "#e8f1fb", initialAngle: 0, logo: LinkedInLogo },
    { name: "Instagram", color: "#a53b28", bg: "#fff0ed", initialAngle: 45, logo: InstagramLogo },
    { name: "YouTube", color: "#FF0000", bg: "#fff5d7", initialAngle: 90, logo: YouTubeLogo },
    { name: "Threads", color: "#000000", bg: "#eceeec", initialAngle: 135, logo: ThreadsLogo },
    { name: "Bluesky", color: "#0085ff", bg: "#e7f3fb", initialAngle: 180, logo: BlueskyLogo },
    { name: "Pinterest", color: "#BD081C", bg: "#fbe9ee", initialAngle: 225, logo: PinterestLogo },
    { name: "Reddit", color: "#FF4500", bg: "#fff1e3", initialAngle: 270, logo: RedditLogo },
    { name: "X", color: "#000000", bg: "#eceeec", initialAngle: 315, logo: XLogo },
  ];

  return (
    <div className="relative mx-auto w-[580px] h-[580px] shrink-0 flex items-center justify-center p-8 overflow-visible select-none">
      
      {/* Central Core: PostSync BrandMark */}
      <motion.div
        animate={{ 
          y: [0, -4, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative z-20 flex h-28 w-28 items-center justify-center rounded-3xl bg-white border border-[#1f2528]/10 shadow-[0_16px_40px_rgba(47,120,103,0.12)] scale-105"
      >
        <BrandMark size="md" />
        <div className="absolute -inset-1 rounded-3xl bg-[#2f7867]/5 blur-md -z-10 animate-pulse" />
      </motion.div>

      {/* Solid Circular Orbit Line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="h-[440px] w-[440px] rounded-full border border-[#1f2528]/8" />
      </div>

      {/* Orbiting Platform Nodes */}
      {platforms.map((p, idx) => {
        const Logo = p.logo;
        return (
          <motion.div
            key={p.name}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              left: 0,
              top: 0,
              transformOrigin: "center center",
              rotate: p.initialAngle
            }}
            animate={{ rotate: p.initialAngle + 360 }}
            transition={{
              repeat: Infinity,
              duration: 28,
              ease: "linear"
            }}
          >
            {/* Counter-rotating platform badge */}
            <motion.div
              style={{
                position: "absolute",
                left: "calc(50% - 40px)",
                top: "38px", // places node exactly on the 440px diameter circle radius!
                transformOrigin: "center center",
                rotate: -p.initialAngle
              }}
              animate={{ rotate: -(p.initialAngle + 360) }}
              transition={{
                repeat: Infinity,
                duration: 28,
                ease: "linear"
              }}
              whileHover={{ 
                scale: 1.15,
                boxShadow: `0 14px 32px rgba(${p.color === "#000000" ? "31,37,40" : p.color === "#1d5b95" ? "29,91,149" : p.color === "#a53b28" ? "165,59,40" : "255,0,0"}, 0.18)`
              }}
              className="z-25 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white border border-[#1f2528]/8 shadow-[0_8px_20px_rgba(0,0,0,0.04)] cursor-pointer transition-all"
            >
              <Logo />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Floating Sparkles decorative */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-10 border border-dashed border-[#2f7867]/5 rounded-full pointer-events-none"
      />

    </div>
  );
}
