"use client";

import { motion } from "motion/react";
import { Monitor, Moon, Sun, Calculator } from "lucide-react";
import { useTheme, type ThemeMode } from "./ThemeProvider";

const options: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function Navbar() {
  const { mode, setMode } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-(--background)/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">
              Othman&apos;s Customs Authority
            </p>
            <p className="text-[11px] text-muted">
              Split customs across order items
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Theme"
          className="relative flex items-center rounded-full border border-border bg-surface p-1"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                aria-label={opt.label}
                onClick={() => setMode(opt.value)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
              >
                {active && (
                  <motion.span
                    layoutId="theme-pill"
                    className="absolute inset-0 rounded-full bg-surface-muted"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`relative h-4 w-4 transition-colors ${
                    active ? "text-foreground" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
