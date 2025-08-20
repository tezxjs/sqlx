import { JoinsType, SortType } from "../types/index.js";
import { parseJoins, parseSort } from "../utils/parse.js";

/**
 * Type for delete operation parameters.
 *
 * @template Tables A tuple of table names for JOINs or sorting.
 */
export interface DeleteParamsType<Tables extends string[]> {
  /**
   * WHERE clause string (required).
   * Example: `"users.id = 5"`
   */
  where: string;

  /**
   * Optional sorting applied to the deletion.
   * Example: `{ column: "created_at", order: "DESC" }`
   */
  sort?: SortType<Tables>;

  /**
   * Optional LIMIT clause to restrict deletion.
   * Example: `10`
   */
  limit?: string | number;

  /**
   * Optional JOINs to delete from related tables.
   */
  joins?: JoinsType<Tables>;
}

/**
 * Generates a raw SQL DELETE query with optional JOINs, WHERE clause, sorting, and limit.
 *
 * @template Tables A tuple of table names used in joins or sorting.
 * @param table - The main table name to delete from.
 * @param params - Delete parameters including where, joins, sort, and limit.
 * @returns {string} A raw SQL DELETE statement.
 *
 * @throws Error if `table` or `where` clause is missing.
 */
export function destroy<Tables extends string[]>(
  table: string,
  { where, joins, limit, sort }: DeleteParamsType<Tables>,
): string {
  // Ensure required parameters are provided
  if (!table) {
    throw new Error("⚠️ The `table` parameter is required.");
  }
  if (!where) {
    throw new Error("⚠️ The `where` parameter is required.");
  }

  // Base query for DELETE
  let query = `DELETE ${table} FROM ${table}`;

  // Add joins if provided
  query += joins ? parseJoins(joins) : "";

  // Add condition if specified (WHERE clause)
  if (where) {
    query += ` WHERE ${where}`;
  }

  // Add sorting if provided
  if (sort) {
    query += parseSort(sort);
  }
  // Add LIMIT if provided
  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  return `${query};`;
}


