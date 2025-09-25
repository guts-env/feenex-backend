import { startOfMonth, endOfMonth } from 'date-fns';

export function getCurrentMonth() {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  return {
    startDate: startOfCurrentMonth,
    endDate: endOfCurrentMonth,
  };
}
