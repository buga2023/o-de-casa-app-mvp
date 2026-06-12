import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Centralizado em datetime.ts; re-export mantém os imports existentes.
export { formatDateTime } from "./datetime";
