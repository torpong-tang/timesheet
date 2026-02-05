import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(hours: number): string {
  const days = (hours / 7).toFixed(1).replace(/\.0$/, '');
  return `${hours}h (${days}d)`;
}
