export * from "./engine_options.js";

export type JoinsType<Tables extends string[]> = string | Array<
  {
    type?:
    | "JOIN"
    | "INNER JOIN"
    | "OUTER JOIN"
    | "CROSS JOIN"
    | "RIGHT JOIN"
    | "LEFT JOIN";
    on: string;
    table: Tables[number] | string & {};
  }
>;


/**
 * Type used for specifying sorting.
 * Can be:
 * - A simple Record<string, 1 | -1> (ascending or descending)
 * - A table-specific object with column sort order
 * - Or a raw SQL string (like "column1 ASC, column2 DESC")
 */
export type SortType<Tables extends string[]> =
  {
    [P in Tables[number]]?: Record<string, 1 | -1> | -1 | 1
  }
  | Record<string, 1 | -1>
  | string;
