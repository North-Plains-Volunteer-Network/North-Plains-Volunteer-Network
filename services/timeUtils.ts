/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30" or "09:00")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM" or "9:00 AM")
 */
export function formatTimeWithAMPM(time24: string): string {
    if (!time24) return '';

    const [hours24, minutes] = time24.split(':');
    const hour = parseInt(hours24, 10);

    if (isNaN(hour)) return time24; // Return original if invalid

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight

    return `${hour12}:${minutes} ${period}`;
}

/**
 * Formats a date and time together
 * @param date - Date string (e.g., "2024-01-15")
 * @param time - Time in 24-hour format (e.g., "14:30")
 * @returns Formatted string (e.g., "2024-01-15 @ 2:30 PM")
 */
export function formatDateTime(date: string, time: string): string {
    if (!date) return '';
    if (!time) return date;

    return `${date} @ ${formatTimeWithAMPM(time)}`;
}
