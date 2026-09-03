/**
 * Utility to construct safe MongoDB date range query for startDate and endDate.
 * Handles boundary conditions:
 * - startDate is expanded to start of day (00:00:00.000)
 * - endDate is expanded to end of day (23:59:59.999)
 * Invalid dates are safely ignored.
 */
function buildDateFilter(startDate, endDate, fieldName = 'date') {
  if (!startDate && !endDate) return {};

  const filter = {};
  const range = {};

  if (startDate) {
    const s = new Date(startDate);
    if (!isNaN(s.getTime())) {
      // Set to beginning of the day in UTC
      const startOfDay = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
      if (!isNaN(startOfDay.getTime())) {
        range.$gte = startOfDay;
      }
    }
  }

  if (endDate) {
    const e = new Date(endDate);
    if (!isNaN(e.getTime())) {
      // Set to end of the day in UTC
      const endOfDay = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
      if (!isNaN(endOfDay.getTime())) {
        range.$lte = endOfDay;
      }
    }
  }

  if (range.$gte || range.$lte) {
    filter[fieldName] = range;
  }

  return filter;
}

module.exports = { buildDateFilter };
