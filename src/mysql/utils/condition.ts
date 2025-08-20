import { sanitize } from "./sanitize.js";

/**
 * Represents a single filter condition or a complex logical condition.
 * Used for building WHERE or HAVING clauses dynamically.
 */
export type FilterValue = string | number | null | undefined | Array<string | number | null | undefined>
  | {
    /**
     * Exclude values matching the list (NOT IN).
     * Example: { notIn: [1, 2, 3] }
     */
    notIn?: Array<string | number | null | undefined>;

    /**
     * Include only values in the list (IN).
     * Example: { in: ['active', 'pending'] }
     */
    in?: Array<string | number | null | undefined>;

    /**
     * Inclusive range using BETWEEN.
     * Example: { between: [100, 200] }
     */
    between?: [any, any];

    /**
     * Inclusive range using NOT BETWEEN.
     * Example: { notBetween: [5, 10] }
     */
    notBetween?: [any, any];

    /**
     * A generic range condition (same as BETWEEN).
     * Example: { inRange: [18, 65] }
     */
    inRange?: [number, number];

    /**
     * Logical OR within a single field's value.
     * Example: { $or: [value1, { gt: 10 }] }
     */
    $or?: FilterValue[];

    /**
     * Pattern matching using SQL LIKE.
     * Example: { like: '%john%' }
     */
    like?: string;

    /**
     * Pattern exclusion using SQL NOT LIKE.
     * Example: { notLike: 'admin%' }
     */
    notLike?: string;

    /**
     * Check for NULL or NOT NULL values.
     * true = IS NULL, false = IS NOT NULL.
     * Example: { isNull: true }
     */
    isNull?: boolean;

    /**
     * Logical AND within a single field's value.
     * Example: { $and: [{ gt: 10 }, { lt: 50 }] }
     */
    $and?: FilterValue[];

    /**
     * Regular expression match (SQL REGEXP or compatible).
     * Example: { regexp: '^abc.*' }
     */
    regexp?: string;

    /**
     * Equality check (column = value).
     * Example: { eq: 'active' }
     */
    eq?: string | number | null | undefined;

    /**
     * Greater than check (column > value).
     * Example: { gt: 5 }
     */
    gt?: string | number | null | undefined;

    /**
     * Less than check (column < value).
     * Example: { lt: 100 }
     */
    lt?: string | number | null | undefined;

    /**
     * Greater than or equal to (column >= value).
     * Example: { gte: 18 }
     */
    gte?: string | number | null | undefined;

    /**
     * Less than or equal to (column <= value).
     * Example: { lte: 99 }
     */
    lte?: string | number | null | undefined;

    /**
     * Not equal check (column != value).
     * Example: { neq: 'inactive' }
     */
    neq?: string | number | null | undefined;
  };

/**
 * A structure that represents filtering logic for WHERE/HAVING clauses.
 */
export type FiltersType =
  /**
   * Basic filters: keys are column names, and values are filter conditions.
   * Example: { status: 'active', age: { gt: 18 } }
   */
  | {
    [column: string]: FilterValue;
  }

  /**
   * Logical grouping using $or or $and at the top level.
   * Useful for complex query logic.
   * Example:
   * {
   *   $or: {
   *     status: 'pending',
   *     age: { lt: 18 }
   *   }
   * }
   */
  | {
    $or?: Record<string, FilterValue>;
    $and?: Record<string, FilterValue>;
  };
export type OperatorType =
  | "=" // Equality
  | "!=" // Not equal (ANSI SQL standard)
  | "<>" // Not equal (alternate syntax)
  | "<" // Less than
  | ">" // Greater than
  | "<=" // Less than or equal
  | ">=" // Greater than or equal
  | "LIKE" // Pattern matching
  | "IN" // Check if value exists in a set
  | "BETWEEN"; // Range condition

/**
 * Handles pattern sanitization for SQL query operators (LIKE, REGEXP, NOT LIKE).
 * Escapes special characters for REGEXP and formats patterns for LIKE.
 *
 * @param value The value to be used in the pattern (e.g., a string for LIKE, REGEXP)
 * @param operator The operator to be applied to the value: "REGEXP", "LIKE", or "NOT LIKE"
 * @returns The sanitized value ready for use in the SQL condition
 */
function handlePattern(
  value: string,
  operator: "REGEXP" | "LIKE" | "NOT LIKE",
): string {
  const escapeRegexp = (str: string): string => {
    // Escape special characters for REGEXP using a manual loop
    const specialChars = new Set(['.', '*', '+', '?', '^', '=', '!', ':', '$', '{', '}', '(', ')', '|', '[', ']', '/', '\\']);
    let result = "'";
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (specialChars.has(ch)) {
        result += '\\' + ch;
      } else {
        result += ch;
      }
    }
    result += "'";
    return result;
  };

  switch (operator) {
    case "REGEXP": {
      // Replace % -> .* and _ -> . manually with a loop
      let replaced = "";
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (ch === '%') {
          replaced += ".*";
        } else if (ch === '_') {
          replaced += ".";
        } else {
          replaced += ch;
        }
      }
      return escapeRegexp(replaced);
    }

    case "LIKE":
    case "NOT LIKE": {
      // Escape special characters manually with a for loop, building the string efficiently
      let escaped = "'";
      for (let i = 0; i < value.length; i++) {
        switch (value.charCodeAt(i)) {
          case 0: escaped += "\\0"; break;
          case 8: escaped += "\\b"; break;
          case 9: escaped += "\\t"; break;
          case 26: escaped += "\\z"; break;
          case 10: escaped += "\\n"; break;
          case 13: escaped += "\\r"; break;
          case 34: escaped += '\\"'; break;
          case 39: escaped += "\\'"; break;
          case 92: escaped += "\\\\"; break;
          default: escaped += value[i];
        }
      }
      escaped += "'";
      return escaped;
    }
    default:
      return sanitize(value);
  }
}
function splitColumn(str: string): [string, string | null] {
  const dotIndex = str.indexOf(".");
  if (dotIndex === -1) {
    return [str, null];
  }
  return [str.slice(0, dotIndex), str.slice(dotIndex + 1)];
}

/**
 * Generates SQL conditions based on the filters object.
 * It dynamically builds the WHERE clause for SQL based on the provided filters and logical operations.
 * 
 * @param filters The filters object containing the conditions
 * @param joinBy The logical operator to join conditions (default: 'AND', can be 'OR')
 * @returns The generated SQL condition string
 * @example
 * // Example filters
const filters: Filters = {
    status: "active", // Exact match
    price: { between: [1000, 5000] }, // BETWEEN condition
    tags: ["electronics", "home"], // IN condition
    location: { not: ["New York", "California"] }, // NOT IN condition
    stock: { inRange: [10, 50] }, // IN RANGE condition (BETWEEN)
    updatedAt: { isNull: true }, // IS NULL condition
    title: { like: "%phone%" }, // LIKE condition (pattern matching)
    description: { notLike: "%old%" }, // NOT LIKE condition
    color: {
        $or: [
            { like: "red" },
            { like: "blue" },
        ],
    }, // OR condition
    $and: {
        category: "electronics",
        brand: { regexp: "^Samsung" }, // REGEXP condition
    },
};
* @Output
```sql
SELECT * FROM products WHERE 
`status` = 'active' AND 
`price` BETWEEN 1000 AND 5000 AND 
`tags` IN ('electronics', 'home') AND 
`location` NOT IN ('New York', 'California') AND 
`stock` BETWEEN 10 AND 50 AND 
`updatedAt` IS NULL AND 
`title` LIKE '%phone%' AND 
`description` NOT LIKE '%old%' AND 
(
    `color` LIKE 'red' OR 
    `color` LIKE 'blue'
) AND 
(
    `category` = 'electronics' AND 
    `brand` REGEXP '^Samsung'
);

```
 */
export function condition(
  filters: FiltersType,
  joinBy: "AND" | "OR" = "AND",
): string {
  // const operatorRegex = /^(<=|>=|!=|<|>|=)/; // Matches all supported operators
  if (!filters || typeof filters !== "object") return "";
  // let conditions: string[] = [];
  // let conditions = "";
  let conditions = "";

  for (let column in filters) {
    const value = filters[column as keyof FiltersType];
    if (column === "$and") {
      const subCondition = condition(value as FiltersType, "AND");
      if (subCondition) {
        if (conditions) conditions += ` ${joinBy} `;
        conditions += `(${subCondition})`;
      }
    }

    else if (column == "$or") {
      const subCondition = condition(value as FiltersType, "OR");
      if (subCondition) {
        if (conditions) conditions += ` ${joinBy} `;
        conditions += `(${subCondition})`;
      }
    }
    else if (typeof value == "object" && value) {
      let [t, col] = splitColumn(column);
      if (col) {
        col = `${t}.\`${col}\``;
      } else {
        col = `\`${column}\``;
      }

      let part = "";
      if (Array.isArray(value)) {
        part = `${col} IN ${sanitize(value)}`;
      }
      else {
        //FOr not include
        if (Array.isArray(value?.notIn) && value?.notIn?.length) {
          part = `${col} NOT IN ${sanitize(value?.notIn)}`;
        }
        if (Array.isArray(value?.in) && value?.in?.length) {
          part = `${col} IN ${sanitize(value?.in)}`;
        }
        if (Array.isArray(value?.between) && value?.between?.length == 2) {
          part = `${col} BETWEEN ${sanitize(value.between[0])} AND ${sanitize(value.between[1])}`;
        }
        if (Array.isArray(value?.notBetween) && value?.notBetween?.length == 2) {
          part = `${col} NOT BETWEEN ${sanitize(value.notBetween[0])} AND ${sanitize(value.notBetween[1])}`;
        }
        if (Array.isArray(value?.inRange) && value?.inRange?.length == 2) {
          part = `${col} BETWEEN ${sanitize(value.inRange[0])} AND ${sanitize(value.inRange[1])}`;
        }

        if (Array.isArray(value?.$or) && value?.$or?.length) {

          let orPart = "";
          for (let i = 0; i < value.$or.length; i++) {
            if (i > 0) orPart += " OR ";
            orPart += condition({ [column]: value.$or[i] }, "OR");
          }
          part = `(${orPart})`;
        }

        if (Array.isArray(value?.$and) && value?.$and.length) {
          let andPart = "";
          for (let i = 0; i < value.$and.length; i++) {
            if (i > 0) andPart += " AND ";
            andPart += condition({ [column]: value.$and[i] }, "AND");
          }
          part = `(${andPart})`;
        }

        if (value?.like && typeof value?.like == "string") {
          part = `${col} LIKE ${handlePattern(value.like, "LIKE")}`;
        }

        if (value?.notLike && typeof value?.notLike == "string") {
          part = `${col} NOT LIKE ${handlePattern(value.notLike, "NOT LIKE")}`;
        }

        if (value?.regexp && typeof value?.regexp == "string") {
          part = `${col} REGEXP ${handlePattern(value.regexp, "REGEXP")}`;
        }
        if (value?.eq) {
          part = `${col} = ${sanitize(value.eq)}`;
        }
        if (value?.gt) {
          part = `${col} > ${sanitize(value.gt)}`;
        }
        if (value?.lt) {
          part = `${col} < ${sanitize(value.lt)}`;
        }
        if (value?.gte) {
          part = `${col} >= ${sanitize(value.gte)}`;
        }
        if (value?.lte) {
          part = `${col} <= ${sanitize(value.lte)}`;
        }
        if (value?.neq) {
          part = `${col} != ${sanitize(value.neq)}`;
        }

        if (value?.isNull != undefined) {
          part = value.isNull ? `${col} IS NULL` : `${col} IS NOT NULL`;
        }
        if (part) {
          if (conditions) conditions += ` ${joinBy} `;
          conditions += part;
        }
      }
    }
    else if (typeof value === "string" || typeof value === "number" || value == null || value == undefined) {
      let [t, col] = splitColumn(column);
      if (col) {
        column = `${t}.\`${col}\``;
      } else {
        column = `\`${column}\``;
      }
      if (conditions) conditions += ` ${joinBy} `;
      conditions += `${column} = ${sanitize(value)}`;
    }
  }
  return conditions;
}
