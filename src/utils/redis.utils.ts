import { format } from 'date-fns';

export function getCurrentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}
