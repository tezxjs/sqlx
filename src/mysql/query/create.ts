import { escape } from "../utils/index.js";

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
export type CreateParamsType<columns extends any[]> =
  {
    [P in columns[number]]?: Value;
  }
  | Record<string, Value>
  | {
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
export function insert<columns extends string[]>(
  table: string,
  values: CreateParamsType<columns>,
  options?: CreateOptionsType,
): string {

  if (!values) throw new Error("❌ Insert data array is empty");

  let col = "";
  let val = "";

  const sanitize = (value: Value): string => {
    if (value === "CURRENT_TIMESTAMP") return value;
    if (value == null) return "NULL";
    if (value == undefined) return "NULL";
    if (typeof value === "string") return escape(value);
    return String(value);
  };

  const single = (row: Record<string, any>) => {
    let c = "", v = "", i = 0;
    for (const key in row) {
      if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
      const s = sanitize(row[key]);
      if (i++ > 0) {
        c += ", ";
        v += ", ";
      }
      c += key;
      v += s;
    }
    if (!i) throw new Error("❌ Empty row object passed");
    return [`(${c})`, `(${v})`] as const;
  };

  if (Array.isArray(values)) {
    let colKeys = "";
    let firstRow = values[0];
    let keys = [];
    for (const k in firstRow) {
      if (!Object.prototype.hasOwnProperty.call(firstRow, k)) continue;
      keys.push(k);
      colKeys += colKeys ? `, ${k}` : k;
    }
    col = `(${colKeys})`;

    let parts = "";
    for (let i = 0; i < values.length; i++) {
      if (i > 0) parts += ", ";
      const row = values[i];
      let inner = "";
      for (let j = 0; j < keys.length; j++) {
        if (j > 0) inner += ", ";
        inner += sanitize((row as any)[keys[j]]);
      }
      parts += `(${inner})`;
    }
    val = parts;
  }
  else {
    [col, val] = single(values);
  }

  // Construct final query
  if (options?.uniqueColumn) {
    return `INSERT IGNORE INTO ${table} ${col} VALUES ${val};`;
  }
  else if (options?.onDuplicateUpdateFields?.length) {
    let sql = `INSERT INTO ${table} ${col} VALUES ${val} ON DUPLICATE KEY UPDATE `;
    const fields = options.onDuplicateUpdateFields;
    for (let i = 0; i < fields.length; i++) {
      if (i > 0) sql += ", ";
      sql += `${fields[i]} = VALUES(${fields[i]})`;
    }
    sql += ";";
    return sql;
  }
  else {
    return `INSERT INTO ${table} ${col} VALUES ${val};`;
  }
}
// INSERT INTO testing(rakib) VALUES('sfsdfdfs'), ('xxx');
