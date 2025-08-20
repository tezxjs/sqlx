/**
 * Represents a single filter condition or a complex logical condition.
 * Used for building WHERE or HAVING clauses dynamically.
 */
export type FilterValue = string | number | null | undefined | Array<string | number | null | undefined> | {
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
{
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
export type OperatorType = "=" | "!=" | "<>" | "<" | ">" | "<=" | ">=" | "LIKE" | "IN" | "BETWEEN";
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
export declare function condition(filters: FiltersType, joinBy?: "AND" | "OR"): string;
