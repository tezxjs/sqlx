/**
 * Options for creating insert queries.
 */
export type CreateOptionsType = {
    /**
     * Column name to use with `INSERT IGNORE`, typically a unique column.
     * If provided, it prevents duplicate row insertions.
     */
    uniqueColumn?: string | null;
    /**
     * List of column names to update if a duplicate key is found.
     * Used with `ON DUPLICATE KEY UPDATE`.
     */
    onDuplicateUpdateFields?: string[];
};
type Value = "CURRENT_TIMESTAMP" | string & {} | number & {} | null & {} | undefined & {};
/**
 * Accepts a record or an array of records representing rows to insert.
 * - Each value must be string | number | 'CURRENT_TIMESTAMP' | undefined
 * - Columns must extend from a string[] array of allowed column names
 */
export type CreateParamsType<columns extends any[]> = {
    [P in columns[number]]?: Value;
} | Record<string, Value> | {
    [P in columns[number]]?: Value;
}[];
/**
 * Generates a raw SQL insert query string from a table name and values.
 *
 * @template columns A tuple of column names.
 *
 * @param table - The table name where data should be inserted.
 * @param values - A single row object or an array of row objects.
 * @param options - Object including optional unique key or duplicate update fields.
 * @returns {string} A SQL `INSERT` query string.
 *
 * @throws Error if values is null or undefined.
 */
export declare function insert<columns extends string[]>(table: string, values: CreateParamsType<columns>, options?: CreateOptionsType): string;
export {};
