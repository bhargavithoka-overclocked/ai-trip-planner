"use client";

import type { AIProvider } from "@/app/types/travel.types";

const OPTIONS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini (free)" },
];

type AIProviderToggleProps = {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
};

/** Small switch under the search bar to pick which AI plans the trip. */
export function AIProviderToggle({ value, onChange }: AIProviderToggleProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/50">
      <span>Plan with</span>
      <div role="radiogroup" aria-label="AI model" className="flex rounded-full border border-white/20 bg-white/5 p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 transition-colors ${
              value === option.value ? "bg-white/20 text-white" : "hover:text-white/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
