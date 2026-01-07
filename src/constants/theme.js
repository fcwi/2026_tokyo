export const getBaseTheme = (tripConfig) => {
  const theme = tripConfig.theme || {};
  return {
    colorBase: theme.colorBase || "stone",
    colorAccent: theme.colorAccent || "amber",
    bgTexture: theme.bgTexture || `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
    bgGradientLight: theme.bgGradientLight || "bg-[#FDFBF7] from-stone-100/50 via-white to-transparent",
    bgGradientDark: theme.bgGradientDark || "bg-[#1A1A1A] from-[#252525] via-[#1A1A1A]/80 to-transparent",
    blobs: theme.blobs || {
      light: ["bg-orange-200/30", "bg-stone-200/30", "bg-amber-100/40"],
      dark: ["bg-amber-500/10", "bg-purple-500/10", "bg-blue-500/10"],
    },
    textColors: theme.textColors || {
      light: "text-stone-800",
      dark: "text-stone-100",
      secLight: "text-stone-500",
      secDark: "text-stone-300",
    },
    semanticColors: theme.semanticColors || {
      blue: { light: "text-[#5D737E]", dark: "text-sky-300" },
      green: { light: "text-[#556B2F]", dark: "text-emerald-300" },
      red: { light: "text-[#A04040]", dark: "text-red-300" },
      orange: { light: "text-[#CD853F]", dark: "text-amber-300" },
      pink: { light: "text-[#BC8F8F]", dark: "text-rose-300" },
    },
    weatherIconColors: theme.weatherIconColors || {
      sun: "text-amber-400",
      moon: "text-indigo-300",
      cloud: "text-gray-400",
      fog: "text-slate-400",
      rain: "text-blue-400",
      snow: "text-cyan-300",
      lightning: "text-yellow-500",
    },
    weatherColors: theme.weatherColors || {
      rain: "#94a3b8",
      cloud: "#cbd5e1",
      snow: "#94a3b8",
    },
    glassColors: theme.glassColors || {
      card: {
        light: "bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-white/20",
        dark: "bg-[#262626]/80 backdrop-blur-xl backdrop-saturate-150 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/5"
      },
      nav: {
        light: "bg-white/70 backdrop-blur-2xl backdrop-saturate-200 border-white/30 shadow-lg ring-1 ring-white/20",
        dark: "bg-[#1A1A1A]/70 backdrop-blur-2xl backdrop-saturate-200 border-white/10 shadow-2xl shadow-black/40 ring-1 ring-white/5"
      },
    },
    tagColors: theme.tagColors || {
      transport: { light: "bg-[#E8F0FE] text-[#3B5998]", dark: "bg-sky-900/30 text-sky-200" },
      food: { light: "bg-[#F0F5E5] text-[#556B2F]", dark: "bg-emerald-900/30 text-emerald-200" },
      shopping: { light: "bg-[#FFF8E1] text-[#8B6B23]", dark: "bg-amber-900/30 text-amber-200" },
      hotel: { light: "bg-[#E6E6FA] text-[#6A5ACD]", dark: "bg-purple-900/30 text-purple-200" },
      spot: { light: "bg-[#FFF0F5] text-[#BC8F8F]", dark: "bg-rose-900/30 text-rose-200" },
    },
    chatColors: theme.chatColors || {
      userBubble: {
        light: "bg-[#5D737E] text-white border-[#4A606A]",
        dark: "bg-sky-800 text-white border-sky-700"
      },
      modelBubble: {
        light: "bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200",
        dark: "bg-neutral-800/90 backdrop-blur-sm text-neutral-200 border-neutral-700"
      },
      bg: {
        light: "bg-[#F9F9F6]/50",
        dark: "bg-black/20"
      }
    },
    mainBg: theme.mainBg || {
      light: "bg-[#F0F2F5] text-slate-700",
      dark: "bg-[#1A1A1A] text-neutral-200"
    },
    particleColors: theme.particleColors || {
      rain: { light: "rgba(100, 149, 237, 0.6)", dark: "rgba(255, 255, 255, 0.5)" },
      snow: "rgba(255, 255, 255, 0.8)",
      stars: "rgba(255, 255, 255, ALPHA)",
      fog: "rgba(200, 200, 200, ALPHA)",
      lightning: "rgba(255, 255, 200, BRIGHTNESS)"
    },
    cloudColors: theme.cloudColors || {
      heavy: "#bdc3c7",
      medium: "#d1d5db",
      light: "#ecf0f1"
    },
    celestialColors: theme.celestialColors || {
      sun: "#f1c40f",
      sunGlow: "#f39c12",
      moon: "#f5f6fa",
      moonShadow: "rgba(245, 246, 250, 0.4)"
    },
    ambientColors: theme.ambientColors || {
      clear: { light: "rgba(255, 255, 255, 0.8)", dark: "rgba(30, 41, 59, 0.5)" },
      cloudy: { light: "rgba(241, 245, 249, 0.85)", dark: "rgba(51, 65, 85, 0.6)" },
      rain: { light: "rgba(219, 234, 254, 0.85)", dark: "rgba(30, 58, 138, 0.4)" },
      snow: { light: "rgba(248, 250, 252, 0.9)", dark: "rgba(71, 85, 105, 0.5)" },
      thunderstorm: { light: "rgba(200, 200, 220, 0.85)", dark: "rgba(30, 30, 50, 0.7)" },
      fog: { light: "rgba(226, 232, 240, 0.85)", dark: "rgba(71, 85, 105, 0.4)" }
    },
    dynamicBg: theme.dynamicBg || {
      rain: { light: "#c7d2e0", dark: "#4a5568" },
      cloud: "#cbd5e1"
    },
    buttonGradients: theme.buttonGradients || {
      primary: { light: "from-[#5D737E] to-[#3F5561]", dark: "from-sky-800 to-blue-900" }
    },
    inputColors: theme.inputColors || {
      focusBorder: { light: "#5D737E", dark: "sky-500" },
      focusRing: { light: "rgba(93, 115, 126, 0.2)", dark: "rgba(14, 165, 233, 0.2)" }
    },
    linkColors: theme.linkColors || {
      hover: { light: "#5D737E", dark: "sky-300" }
    },
    textShadow: theme.textShadow || {
      light: "0 1px 1px rgba(255,255,255,0.5)",
      dark: "0 2px 4px rgba(0,0,0,0.3)"
    },
    borderRadius: theme.borderRadius || {
      small: "rounded-xl",
      card: "rounded-2xl",
      modal: "rounded-3xl",
      full: "rounded-full"
    },
    spacing: theme.spacing || {
      cardSmall: "p-3",
      card: "p-4",
      cardLarge: "p-5"
    }
  };
};
