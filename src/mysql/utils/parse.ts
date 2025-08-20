import { FindAllParamsType, } from "../query/find.js";
import { JoinsType, SortType } from "../types/index.js";

export function parseSort<Tables extends string[]>(
  sort: SortType<Tables>,
): string {
  if (!sort) return "";
  // Handle the case where sort is a simple string
  if (typeof sort === "string") {
    return ` ORDER BY ${sort}`;
  }
  // Handle the case where sort is a Record<string, 1 | -1>
  if (typeof sort === "object") {
    let first = true;
    let out = "";
    for (const table in sort) {
      if (!Object.prototype.hasOwnProperty.call(sort, table)) continue;

      const columns = sort[table as keyof typeof sort];

      if (typeof columns === "number") {
        if (out) out += ", ";
        out += table + (columns === 1 ? " ASC" : " DESC");
      }
      else if (typeof columns === "object") {
        for (const col in columns) {
          if (!Object.prototype.hasOwnProperty.call(columns, col)) continue;
          if (out) out += ", ";
          out += table + "." + col + (columns[col] === 1 ? " ASC" : " DESC");
        }
      }
    }
    if (out) return " ORDER BY " + out;
  }
  return "";
}


export function parseGroupBy<Tables extends string[]>(groupBy: FindAllParamsType<Tables>["groupBy"],): string {
  if (!groupBy) return "";

  // Case 1: string
  if (typeof groupBy === "string") return ` GROUP BY ${groupBy}`;

  // Case 2: array
  if (Array.isArray(groupBy)) return ` GROUP BY ${groupBy.join(", ")}`;

  // Case 3: object
  if (typeof groupBy === "object") {
    let out = "";
    for (const table in groupBy) {
      if (!Object.prototype.hasOwnProperty.call(groupBy, table)) continue;
      const val = groupBy[table as keyof typeof groupBy];

      if (table === "extra") {
        if (Array.isArray(val) && val.length) {
          if (out) out += ", ";
          out += val.join(", ");
        }
        else if (val) {
          if (out) out += ", ";
          out += val;
        }
      }
      else if (Array.isArray(val) && val.length) {
        if (out) out += ", ";
        for (let i = 0; i < val.length; i++) {
          if (i) out += ", ";
          out += table;
          out += ".";
          out += val[i];
        }
      }
    }
    if (out) {
      return " GROUP BY " + out
    }
  }
  return "";
}

export function parseColumns<Tables extends string[]>(columns: FindAllParamsType<Tables>["columns"]): string {
  if (!columns) return "";

  // Case 1: `` is a simple string
  if (typeof columns === "string") return columns;

  // Case 2: `` is an array of strings
  if (Array.isArray(columns)) return columns.join(", ");

  // Case 3: `` is an object
  if (typeof columns === "object") {
    let out = "";

    for (const table in columns) {
      if (!Object.prototype.hasOwnProperty.call(columns, table)) continue;
      const col = columns[table as keyof typeof columns];

      if (table === "extra") {
        if (Array.isArray(col)) {
          if (out) out += ", ";
          out += col.join(", ");
        }
        else if (col) {
          if (out) out += ", ";
          out += col;
        }
      }
      else if (Array.isArray(col) && col.length) {
        if (out) out += ", ";
        for (let i = 0; i < col.length; i++) {
          if (i) out += ", ";
          out += table;
          out += ".";
          out += col[i];
        }
      }
    }
    return out;
  }
  return "";
}

export function parseJoins<Tables extends string[]>(
  joins: JoinsType<Tables>
): string {
  if (!joins) return "";

  if (typeof joins === "string") {
    return joins.trim();
  }

  let out = "";
  for (let i = 0; i < joins.length; i++) {
    const { on, table, type } = joins[i];

    if (!table) {
      throw new Error(`❌ Missing table name in join at index ${i}`);
    }
    if (!on) {
      throw new Error(`❌ Missing 'on' condition in join at index ${i}`);
    }

    out += ` ${type || "JOIN"} ${table} ON ${on}`;
  }

  return out.trim();
}
