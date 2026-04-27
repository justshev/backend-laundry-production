export function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDurationToDate(baseDate: Date, duration: string) {
  const match = duration.match(/^(\d+)([mhd])$/i);

  if (!match) {
    return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const [, rawValue, unit] = match;
  const value = Number(rawValue);
  const multiplier = unit.toLowerCase() === "m" ? 60 * 1000 : unit.toLowerCase() === "h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  return new Date(baseDate.getTime() + value * multiplier);
}

export interface DateRangeFilters {
  exactDate?: string;
  startDate?: string;
  endDate?: string;
}

export function buildDateRange(filters: DateRangeFilters) {
  if (filters.exactDate) {
    const exact = new Date(filters.exactDate);
    return {
      gte: startOfDay(exact),
      lte: endOfDay(exact),
    };
  }

  const range: { gte?: Date; lte?: Date } = {};

  if (filters.startDate) {
    range.gte = startOfDay(new Date(filters.startDate));
  }

  if (filters.endDate) {
    range.lte = endOfDay(new Date(filters.endDate));
  }

  return range;
}

export function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
