/**
 * Pakistan Standard Time is UTC+5 (300 minutes ahead).
 */
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * Returns 'YYYY-MM' string in Pakistan Standard Time (UTC+5)
 */
export function getMonthYearPkt(dateInput = new Date()) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const pktDate = new Date(d.getTime() + PKT_OFFSET_MS);
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns safe start/end Date objects for a given month in PKT ('YYYY-MM')
 */
export function getMonthDateRangePkt(monthStr) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    const current = getMonthYearPkt();
    return getMonthDateRangePkt(current);
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-12

  // Start of month in PKT: YYYY-MM-01 00:00:00 +05:00
  const startIso = `${yearStr}-${monthNumStr}-01T00:00:00.000+05:00`;
  const startDate = new Date(startIso);

  // Determine last day of the month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayStr = String(lastDay).padStart(2, '0');
  const endIso = `${yearStr}-${monthNumStr}-${lastDayStr}T23:59:59.999+05:00`;
  const endDate = new Date(endIso);

  return { startDate, endDate };
}

/**
 * Utility to construct safe MongoDB date range query for startDate and endDate.
 * Handles boundary conditions with Pakistan Standard Time (UTC+5) awareness:
 * - startDate is expanded to start of day in PKT (00:00:00.000 +05:00)
 * - endDate is expanded to end of day in PKT (23:59:59.999 +05:00)
 * Invalid or empty dates are safely ignored.
 */
export function buildDateFilter(startDate, endDate, fieldName = 'date') {
  if (!startDate && !endDate) return {};

  const filter = {};
  const range = {};

  if (startDate) {
    let sDate;
    if (typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      sDate = new Date(`${startDate.trim()}T00:00:00.000+05:00`);
    } else {
      sDate = new Date(startDate);
    }

    if (!isNaN(sDate.getTime())) {
      range.$gte = sDate;
    }
  }

  if (endDate) {
    let eDate;
    if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      eDate = new Date(`${endDate.trim()}T23:59:59.999+05:00`);
    } else {
      eDate = new Date(endDate);
    }

    if (!isNaN(eDate.getTime())) {
      range.$lte = eDate;
    }
  }

  if (range.$gte || range.$lte) {
    filter[fieldName] = range;
  }

  return filter;
}

export default {
  getMonthYearPkt,
  getMonthDateRangePkt,
  buildDateFilter,
};
