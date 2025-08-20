/**
 * Sanitize input to prevent SQL injection.
 * @param input - The user input to be sanitized.
 * @returns Escaped and safe input for MySQL queries.
 */
export declare function sanitize(input: any): string;
/**
 * Escape special characters in a string to prevent SQL injection.
 * @param value - The value to be escaped.
 * @returns The escaped string.
 */
export declare function escape(val: any): any;
/**
 * Formats a query string by replacing placeholders (`?`) with escaped values.
 * @param query - The base SQL query with placeholders.
 * @param values - Array of values to replace placeholders.
 * @returns The formatted query string.
 */
export declare function format(query: string, values: any[]): string;
export interface MySQLConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    params: Record<string, any>;
}
export declare function parseMySQLUrl(url: string): MySQLConfig;
