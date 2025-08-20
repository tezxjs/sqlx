import { performance } from "node:perf_hooks";

/** Dummy sanitize - just JSON stringify with some tweaks for demonstration */
function sanitize(value) {
    if (Array.isArray(value)) {
        return "(" + value.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ") + ")";
    }
    if (value === null) return "NULL";
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    return String(value);
}

/** Dummy handlePattern for LIKE/NOT LIKE/REGEXP (simplified) */
function handlePattern(value, operator) {
    return sanitize(value);
}

/** splitColumn helper */
function splitColumn(column) {
    const idx = column.indexOf(".");
    if (idx === -1) return [null, column];
    return [column.substring(0, idx), column.substring(idx + 1)];
}

/** Test filters object */
const testFilters = {
    status: "active",
    price: { between: [100, 200] },
    tags: ["electronics", "home"],
    location: { notIn: ["New York", "California"] },
    stock: { inRange: [10, 50] },
    updatedAt: { isNull: true },
    title: { like: "%phone%" },
    description: { notLike: "%old%" },
    color: {
        $or: [
            { like: "red" },
            { like: "blue" },
        ],
    },
    $and: {
        category: "electronics",
        brand: { regexp: "^Samsung" },
    },
};

/** Array-based condition function */
function conditionArray(filters, joinBy = "AND") {
    if (!filters || typeof filters !== "object") return "";
    let conditions = [];

    for (let column in filters) {
        const value = filters[column];
        if (column === "$and") {
            conditions.push(`(${conditionArray(value, "AND")})`);
        } else if (column === "$or") {
            conditions.push(`(${conditionArray(value, "OR")})`);
        } else if (typeof value === "object" && value) {
            let [t, col] = splitColumn(column);
            if (col) {
                col = `${t}.\`${col}\``;
            } else {
                col = `\`${column}\``;
            }

            if (Array.isArray(value)) {
                conditions.push(`${col} IN ${sanitize(value)}`);
            } else {
                if (Array.isArray(value.notIn) && value.notIn.length) {
                    conditions.push(`${col} NOT IN ${sanitize(value.notIn)}`);
                }
                if (Array.isArray(value.in) && value.in.length) {
                    conditions.push(`${col} IN ${sanitize(value.in)}`);
                }
                if (Array.isArray(value.between) && value.between.length === 2) {
                    conditions.push(`${col} BETWEEN ${sanitize(value.between[0])} AND ${sanitize(value.between[1])}`);
                }
                if (Array.isArray(value.notBetween) && value.notBetween.length === 2) {
                    conditions.push(`${col} NOT BETWEEN ${sanitize(value.notBetween[0])} AND ${sanitize(value.notBetween[1])}`);
                }
                if (Array.isArray(value.inRange) && value.inRange.length === 2) {
                    conditions.push(`${col} BETWEEN ${sanitize(value.inRange[0])} AND ${sanitize(value.inRange[1])}`);
                }
                if (Array.isArray(value.$or) && value.$or.length) {
                    const orConditions = [];
                    for (let i = 0; i < value.$or.length; i++) {
                        orConditions.push(conditionArray({ [column]: value.$or[i] }, "OR"));
                    }
                    conditions.push(`(${orConditions.join(" OR ")})`);
                }
                if (Array.isArray(value.$and) && value.$and.length) {
                    const andConditions = [];
                    for (let i = 0; i < value.$and.length; i++) {
                        andConditions.push(conditionArray({ [column]: value.$and[i] }, "AND"));
                    }
                    conditions.push(`(${andConditions.join(" AND ")})`);
                }
                if (value.like && typeof value.like === "string") {
                    conditions.push(`${col} LIKE ${handlePattern(value.like, "LIKE")}`);
                }
                if (value.notLike && typeof value.notLike === "string") {
                    conditions.push(`${col} NOT LIKE ${handlePattern(value.notLike, "NOT LIKE")}`);
                }
                if (value.regexp && typeof value.regexp === "string") {
                    conditions.push(`${col} REGEXP ${handlePattern(value.regexp, "REGEXP")}`);
                }
                if (value.eq !== undefined) {
                    conditions.push(`${col} = ${sanitize(value.eq)}`);
                }
                if (value.gt !== undefined) {
                    conditions.push(`${col} > ${sanitize(value.gt)}`);
                }
                if (value.lt !== undefined) {
                    conditions.push(`${col} < ${sanitize(value.lt)}`);
                }
                if (value.gte !== undefined) {
                    conditions.push(`${col} >= ${sanitize(value.gte)}`);
                }
                if (value.lte !== undefined) {
                    conditions.push(`${col} <= ${sanitize(value.lte)}`);
                }
                if (value.neq !== undefined) {
                    conditions.push(`${col} != ${sanitize(value.neq)}`);
                }
                if (value.isNull !== undefined) {
                    conditions.push(value.isNull ? `${col} IS NULL` : `${col} IS NOT NULL`);
                }
            }
        } else if (
            typeof value === "string" ||
            typeof value === "number" ||
            value === null ||
            value === undefined
        ) {
            let [t, col] = splitColumn(column);
            if (col) {
                column = `${t}.\`${col}\``;
            } else {
                column = `\`${column}\``;
            }
            conditions.push(`${column} = ${sanitize(value)}`);
        }
    }
    return conditions.length ? conditions.join(` ${joinBy} `) : "";
}

/** String concat-based condition function */
function conditionConcat(filters, joinBy = "AND") {
    if (!filters || typeof filters !== "object") return "";
    let conditions = "";

    for (let column in filters) {
        const value = filters[column];
        if (column === "$and") {
            const subCondition = conditionConcat(value, "AND");
            if (subCondition) {
                if (conditions) conditions += ` ${joinBy} `;
                conditions += `(${subCondition})`;
            }
        } else if (column === "$or") {
            const subCondition = conditionConcat(value, "OR");
            if (subCondition) {
                if (conditions) conditions += ` ${joinBy} `;
                conditions += `(${subCondition})`;
            }
        } else if (typeof value === "object" && value) {
            let [t, col] = splitColumn(column);
            if (col) {
                col = `${t}.\`${col}\``;
            } else {
                col = `\`${column}\``;
            }

            let part = "";

            if (Array.isArray(value)) {
                part = `${col} IN ${sanitize(value)}`;
            } else {
                if (Array.isArray(value.notIn) && value.notIn.length) {
                    part = `${col} NOT IN ${sanitize(value.notIn)}`;
                } else if (Array.isArray(value.in) && value.in.length) {
                    part = `${col} IN ${sanitize(value.in)}`;
                } else if (Array.isArray(value.between) && value.between.length === 2) {
                    part = `${col} BETWEEN ${sanitize(value.between[0])} AND ${sanitize(value.between[1])}`;
                } else if (Array.isArray(value.notBetween) && value.notBetween.length === 2) {
                    part = `${col} NOT BETWEEN ${sanitize(value.notBetween[0])} AND ${sanitize(value.notBetween[1])}`;
                } else if (Array.isArray(value.inRange) && value.inRange.length === 2) {
                    part = `${col} BETWEEN ${sanitize(value.inRange[0])} AND ${sanitize(value.inRange[1])}`;
                } else if (Array.isArray(value.$or) && value.$or.length) {
                    let orPart = "";
                    for (let i = 0; i < value.$or.length; i++) {
                        if (i > 0) orPart += " OR ";
                        orPart += conditionConcat({ [column]: value.$or[i] }, "OR");
                    }
                    part = `(${orPart})`;
                } else if (Array.isArray(value.$and) && value.$and.length) {
                    let andPart = "";
                    for (let i = 0; i < value.$and.length; i++) {
                        if (i > 0) andPart += " AND ";
                        andPart += conditionConcat({ [column]: value.$and[i] }, "AND");
                    }
                    part = `(${andPart})`;
                } else if (value.like && typeof value.like === "string") {
                    part = `${col} LIKE ${handlePattern(value.like, "LIKE")}`;
                } else if (value.notLike && typeof value.notLike === "string") {
                    part = `${col} NOT LIKE ${handlePattern(value.notLike, "NOT LIKE")}`;
                } else if (value.regexp && typeof value.regexp === "string") {
                    part = `${col} REGEXP ${handlePattern(value.regexp, "REGEXP")}`;
                } else if (value.eq !== undefined) {
                    part = `${col} = ${sanitize(value.eq)}`;
                } else if (value.gt !== undefined) {
                    part = `${col} > ${sanitize(value.gt)}`;
                } else if (value.lt !== undefined) {
                    part = `${col} < ${sanitize(value.lt)}`;
                } else if (value.gte !== undefined) {
                    part = `${col} >= ${sanitize(value.gte)}`;
                } else if (value.lte !== undefined) {
                    part = `${col} <= ${sanitize(value.lte)}`;
                } else if (value.neq !== undefined) {
                    part = `${col} != ${sanitize(value.neq)}`;
                } else if (value.isNull !== undefined) {
                    part = value.isNull ? `${col} IS NULL` : `${col} IS NOT NULL`;
                }
            }

            if (part) {
                if (conditions) conditions += ` ${joinBy} `;
                conditions += part;
            }
        } else if (
            typeof value === "string" ||
            typeof value === "number" ||
            value === null ||
            value === undefined
        ) {
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

/** Run benchmark */
function runBenchmark() {
    const ITERATIONS = 10000;

    let start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        conditionArray(testFilters, "AND");
    }
    let end = performance.now();
    console.log(`Array-based condition: ${(end - start).toFixed(3)} ms`);

    start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        conditionConcat(testFilters, "AND");
    }
    end = performance.now();
    console.log(`String concat condition: ${(end - start).toFixed(3)} ms`);
}

runBenchmark();
