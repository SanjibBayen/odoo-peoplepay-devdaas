/**
 * Date formatting utilities for PeoplePay.
 */

/**
 * Formats an ISO string, timestamp, or Date into a specified format.
 * Supported tokens: DD, MM, YYYY, Mon, Month, HH, mm, ss, A (AM/PM).
 * Defaults to 'DD Mon YYYY'.
 *
 * @param {string|Date|number} dateInput
 * @param {string} [format='DD Mon YYYY']
 * @returns {string}
 */
export function formatDate(dateInput, format = 'DD Mon YYYY') {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());

  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthShort = monthNamesShort[d.getMonth()];
  const monthFull = monthNamesFull[d.getMonth()];

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  let output = format;
  output = output.replace(/YYYY/g, year);
  output = output.replace(/Month/g, monthFull);
  output = output.replace(/Mon/g, monthShort);
  output = output.replace(/MM/g, monthNum);
  output = output.replace(/DD/g, day);
  output = output.replace(/HH/g, hoursStr);
  output = output.replace(/mm/g, minutes);
  output = output.replace(/ss/g, seconds);
  output = output.replace(/A/g, ampm);

  return output;
}

/**
 * Returns a human-readable relative time description (e.g. "2 hours ago", "yesterday", "in 3 days").
 *
 * @param {string|Date|number} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSec) < 45) return 'just now';
  if (diffSec > 0) {
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(d, 'DD Mon YYYY');
  } else {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 0) return 'today';
    if (futureDays === 1) return 'tomorrow';
    return `in ${futureDays}d`;
  }
}

/**
 * Returns formatted 12-hour time string (e.g. "09:30 AM").
 *
 * @param {string|Date|number} dateInput
 * @returns {string}
 */
export function formatTime(dateInput) {
  return formatDate(dateInput, 'HH:mm A');
}

export default formatDate;
