import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number) {
  return Math.round(value).toString();
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function trendDirection(current: number, previous: number | null): "up" | "down" | "flat" {
  if (previous === null) return "flat";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}
