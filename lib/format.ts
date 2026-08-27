// Number and date formatting, kept locale free on purpose.
//
// Every function here has to produce the same string on the server and in the
// browser, otherwise React hydration complains. That rules out toLocaleString
// and Intl, so the separators and the month names are written out by hand.

/** Signed USDT string, stable between server and client render. */
export function usdt(n: number): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}${Math.abs(n).toFixed(2)}`;
}

export function pct(n: number, digits = 2): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}

/** ISO string to "Aug 28 04:11 UTC" without touching the browser locale. */
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function stamp(iso: string): string {
  const d = new Date(iso);
  const mon = MONTHS[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mon} ${day} ${hh}:${mm} UTC`;
}
