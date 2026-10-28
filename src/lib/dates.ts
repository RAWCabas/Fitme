/**
 * Returns current UTC time as an ISO string with milliseconds.
 * e.g., "2026-10-29T01:30:00.000Z"
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Returns current date in YYYY-MM-DD format.
 */
export function todayIso(): string {
  return nowIso().slice(0, 10);
}

/**
 * Formats an ISO date/datetime string into a friendly readable format.
 * e.g., "Oct 29, 2026"
 */
export function formatDisplayDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Returns a human-friendly relative time description.
 * e.g., "just now", "5 minutes ago", "3 days ago"
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return "1 hour ago";
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 30) return `${diffDay} days ago`;

  return formatDisplayDate(date);
}
