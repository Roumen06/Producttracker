import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "—";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  if (hours < 24) return `před ${hours} hod`;
  if (days < 7) return `před ${days} dny`;
  return formatDate(d);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "text-red-500 bg-red-500/10";
    case "medium":
      return "text-yellow-500 bg-yellow-500/10";
    case "low":
      return "text-green-500 bg-green-500/10";
    default:
      return "text-gray-500 bg-gray-500/10";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "hledám":
      return "text-blue-500 bg-blue-500/10";
    case "našel":
      return "text-green-500 bg-green-500/10";
    case "koupil":
      return "text-purple-500 bg-purple-500/10";
    case "skip":
      return "text-gray-500 bg-gray-500/10";
    default:
      return "text-gray-500 bg-gray-500/10";
  }
}

export function getConfidenceColor(confidence: number | null | undefined): string {
  if (!confidence) return "text-gray-500";
  if (confidence >= 9) return "text-green-500";
  if (confidence >= 7) return "text-yellow-500";
  return "text-red-500";
}
