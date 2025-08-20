import { JoinsType, SortType } from "../types/index.js";
/**
 * Parameters used to construct a complex SELECT SQL query.
 * Supports joins, recursive CTEs, aggregate functions, sorting, grouping, and more.
 */
export interface FindOneParamsType<Tables extends string[]> {
    /**
     * If true, applies the DISTINCT keyword to the SELECT query.
     */
    distinct?: boolean;
    /**
     * Sorting logic: either a single object, table-based object, or raw SQL string.
     */
    sort?: SortType<Tables>;
    /**
     * Columns to select:
     * - Can be table-specific: { users: ['id', 'name'], orders: ['total'] }
     * - Can include 'extra' for raw SQL snippets or aliases
     * - Can be a simple array of column names or string
     */
    columns?: {
        [P in Tables[number]]?: string[];
    } | {
        extra?: string | string[];
    } | string[] | string;
    /**
     * Columns to group by:
     * - Can be table-specific: { users: ['id'], orders: ['user_id'] }
     * - Can include 'extra' for raw SQL expressions
     * - Can be a simple array of column names or string
     */
    groupBy?: {
        [P in Tables[number]]?: string[];
    } | {
        extra?: string | string[];
    } | string[] | string;
    /**
     * Array of aggregate functions to use in SELECT clause.
     * Each object can specify one or more of the following:
     * - MIN, MAX, SUM, COUNT, AVG: with column name as value
     * - Optional alias for result field
     */
    aggregates?: Array<Partial<Record<"MIN" | "MAX" | "SUM" | "COUNT" | "AVG", string>> & {
        alias?: string;
    }>;
    /**
     * WHERE clause condition (as raw SQL string).
     */
    where?: string;
    /**
     * HAVING clause condition (used after GROUP BY).
     */
    having?: string;
    /**
     * Subqueries to include in the SELECT clause.
     * Each subquery should be a valid SQL snippet with an optional alias.
     */
    subQueries?: Array<{
        query: string;
        as?: string;
    }>;
    /**
     * JOIN definitions for the query.
     * Should follow a custom JoinsType structure that supports
     * JOIN type, conditions, and table aliases.
     */
    joins?: JoinsType<Tables>;
    /**
     * Recursive Common Table Expression (CTE) configuration.
     * Used for hierarchical data (e.g., categories, tree structures).
     * Must include:
     * - baseCase: initial SELECT statement
     * - recursiveCase: recursive SELECT referring to the alias
     * - alias: name of the CTE to be used in the main query
     */
    recursiveCTE?: {
        baseCase: string;
        recursiveCase: string;
        alias: string;
    };
}
export interface FindAllParamsType<Tables extends string[]> extends FindOneParamsType<Tables> {
    /**
     * Pagination control:
     * - limit: number of records to return
     * - skip: number of records to skip (offset)
     */
    limitSkip?: {
        limit?: number;
        skip?: number;
    };
}
/**
 * Generates a complex SQL SELECT query with support for JOINs, aggregate functions,
 * recursive CTEs, groupings, subqueries, pagination, and more.
 *
 * @template Tables A list of table names to assist with column inference and sorting.
 * @param table - The main table name for the query.
 * @param config - Optional query configuration object.
 * @returns A raw SQL SELECT query string.
 */
export declare function find<Tables extends string[]>(table: string, config?: FindAllParamsType<Tables>): string;
