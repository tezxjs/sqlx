/**
 * Converts a given date (or the current date if none is provided) to a MySQL-compatible
 * datetime string in the format 'YYYY-MM-DD HH:MM:SS'.
 *
 * @param date - Optional. A `Date` object or a date string. If not provided, the current date and time will be used.
 * @returns A MySQL-compatible datetime string formatted as 'YYYY-MM-DD HH:MM:SS'.
 */
export function mysql_datetime(date?: Date | string): string {
  let currentDate = date ? new Date(date) : new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minute = currentDate.getMinutes();
  const second = currentDate.getSeconds();
  const formattedDate = `${year}-${month}-${day} ${hours}:${minute}:${second}`;
  return formattedDate;
}

/**
 * Converts a given date (or the current date if none is provided) to a MySQL-compatible
 * date string in the format 'YYYY-MM-DD'.
 *
 * @param date - Optional. A `Date` object or a date string. If not provided, the current date will be used.
 * @returns A MySQL-compatible date string formatted as 'YYYY-MM-DD'.
 */

export function mysql_date(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  return (
    year +
    '-' +
    (month < 10 ? '0' + month : month) +
    '-' +
    (day < 10 ? '0' + day : day)
  );
}