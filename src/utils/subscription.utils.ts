import { addDays, addWeeks, addMonths, addYears, isSameDay } from 'date-fns';

export function calculateNextBillingDate(
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  lastBillingDate?: Date,
): Date {
  const baseDate = lastBillingDate || startDate;

  switch (frequency) {
    case 'daily':
      return addDays(baseDate, 1);
    case 'weekly':
      return addWeeks(baseDate, 1);
    case 'monthly':
      return addMonths(baseDate, 1);
    case 'yearly':
      return addYears(baseDate, 1);
    default:
      throw new Error(`Invalid frequency`);
  }
}

export function isSubscriptionDue(
  billingDate: Date,
  checkDate: Date = new Date(),
): boolean {
  return isSameDay(billingDate, checkDate);
}
