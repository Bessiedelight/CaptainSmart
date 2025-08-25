import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers in a human-readable way (e.g., 1.2K, 2.5M)
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0")
      ? `${Math.floor(num / 1000)}K`
      : `${formatted}K`;
  }

  if (num < 1000000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith(".0")
      ? `${Math.floor(num / 1000000)}M`
      : `${formatted}M`;
  }

  const formatted = (num / 1000000000).toFixed(1);
  return formatted.endsWith(".0")
    ? `${Math.floor(num / 1000000000)}B`
    : `${formatted}B`;
}
