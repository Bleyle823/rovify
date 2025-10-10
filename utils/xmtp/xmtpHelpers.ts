/** Format a chat timestamp like "14:32", "Yesterday 09:05", or "2025-09-12 21:44". */
export function formatMessageDate(date: Date): string {
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (sameDay) return `${HH}:${mm}`;
  if (isYesterday) return `Yesterday ${HH}:${mm}`;

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
}

/** If you ever want to pass XMTP nanoseconds directly. */
export function nsToDate(ns: bigint | number): Date {
  const ms = typeof ns === "bigint" ? Number(ns / 1_000_000n) : Math.floor(ns / 1_000_000);
  return new Date(ms);
}