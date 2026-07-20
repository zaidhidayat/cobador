function pad(number: number, width = 2): string {
  return String(number).padStart(width, "0");
}

export function gmt7Date(offsetMinutes = 0): Date {
  return new Date(Date.now() + (7 * 60 + offsetMinutes) * 60_000);
}

export function javaLikeTimestamp(date = new Date()): string {
  const local = new Date(date.getTime());
  const ms2 = pad(Math.floor(local.getMilliseconds() / 10), 2);
  const tz = "+07:00";
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60_000);
  return `${gmt7.getUTCFullYear()}-${pad(gmt7.getUTCMonth() + 1)}-${pad(gmt7.getUTCDate())}T${pad(gmt7.getUTCHours())}:${pad(gmt7.getUTCMinutes())}:${pad(gmt7.getUTCSeconds())}.${ms2}${tz}`;
}

export function tsGmt7WithoutColon(date = new Date()): string {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60_000);
  return `${gmt7.getUTCFullYear()}-${pad(gmt7.getUTCMonth() + 1)}-${pad(gmt7.getUTCDate())}T${pad(gmt7.getUTCHours())}:${pad(gmt7.getUTCMinutes())}:${pad(gmt7.getUTCSeconds())}.${pad(gmt7.getUTCMilliseconds(), 3)}+0700`;
}
