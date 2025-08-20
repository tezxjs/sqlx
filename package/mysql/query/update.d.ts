import { JoinsType, SortType } from "../types/index.js";
/**
 * Type representing the structure of parameters that can be passed
 * to the `update` function for generating a dynamic SQL UPDATE query.
 */
export type UpdateParamsType<Tables extends string[]> = {
    /**
     * An object where each key is a column name to update,
     * and the value is either:
     * - a static value (string | number | null | undefined),
     * - or a dynamic CASE expression object.
     */
    values?: {
        [column: string]: string | number | null | undefined | {
            /**
             * Defines a CASE statement for conditional logic.
             * Each case includes:
             * - a WHEN condition (SQL string),
             * - a THEN value (assigned if the condition is met).
             */
            case: {
                when: string;
                then: any;
            }[];
            /**
             * The value to use if none of the WHEN conditions match.
             */
            default: any;
        };
    };
    /**
     * Defines sorting for the update operation, useful when combined with LIMIT.
     * It supports:
     * - object mapping table to column-direction pairs,
     * - or a global column-direction map,
     * - or a raw SQL string.
     */
    sort?: SortType<Tables>;
    /**
     * The WHERE condition to filter rows that should be updated.
     * Must be a valid SQL WHERE clause string.
     */
    where: string;
    /**
     * Array of column names that should be reset to their DEFAULT values.
     * These columns will be set using `column = DEFAULT` in the query.
     */
    defaultValues?: string[];
    /**
     * LIMIT clause to restrict the number of rows updated.
     * Can be a number or string (for raw SQL).
     * Note: Not all SQL dialects support LIMIT in UPDATE.
     */
    limit?: string | number;
    /**
     * Defines JOIN clauses for multi-table UPDATEs.
     * This enables you to update a table based on joins with other tables.
     */
    joins?: JoinsType<Tables>;
    /**
     * Used to include subqueries in the FROM clause of the update.
     * Each key represents an alias name, and the value is the raw SQL subquery.
     * Example: { temp: '(SELECT id FROM logs WHERE active = 1)' }
     */
    fromSubQuery?: Record<string, string>;
    /**
     * Used to assign custom SQL expressions in the SET clause.
     * Each key is a column name, and the value is a SQL expression string.
     * Example: { total_price: "price * quantity" }
     */
    setCalculations?: {
        [column: string]: string;
    };
};
/**
 * Function to generate a SQL UPDATE query using flexible parameters.
 * Supports advanced features like conditional CASE expressions,
 * JOINs, subqueries, column resets, sorting, and calculated fields.
 *
 * @param table - The name of the main table to be updated.
 * @param config - Configuration object containing all update parameters.
 * @returns A raw SQL UPDATE query string.
 */
export declare function update<Tables extends string[]>(table: string, params: UpdateParamsType<Tables>): string;
