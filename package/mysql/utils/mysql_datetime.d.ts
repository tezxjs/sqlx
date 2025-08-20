/**
 * Converts a given date (or the current date if none is provided) to a MySQL-compatible
 * datetime string in the format 'YYYY-MM-DD HH:MM:SS'.
 *
 * @param date - Optional. A `Date` object or a date string. If not provided, the current date and time will be used.
 * @returns A MySQL-compatible datetime string formatted as 'YYYY-MM-DD HH:MM:SS'.
 */
export declare function mysql_datetime(date?: Date | string): string;
/**
 * Converts a given date (or the current date if none is provided) to a MySQL-compatible
 * date string in the format 'YYYY-MM-DD'.
 *
 * @param date - Optional. A `Date` object or a date string. If not provided, the current date will be used.
 * @returns A MySQL-compatible date string formatted as 'YYYY-MM-DD'.
 */
export declare function mysql_date(date?: Date | string): string;
