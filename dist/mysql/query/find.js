import { parseColumns, parseGroupBy, parseJoins, parseSort, } from "../utils/parse.js";
let aggregates_alias = {
    MIN: "minimum",
    MAX: "maximum",
    SUM: "summation",
    COUNT: "count",
    AVG: "average",
};
export function find(table, config = {}) {
    const { distinct, sort, limitSkip, columns, subQueries, groupBy, recursiveCTE, aggregates, where, having, joins, } = config;
    let main_table = table;
    let sql = ``;
    if (recursiveCTE) {
        const { baseCase, recursiveCase, alias } = recursiveCTE;
        sql += `WITH RECURSIVE ${alias} AS (
            ${baseCase}
            UNION ALL
            ${recursiveCase}
        ) `;
        main_table = alias;
    }
    sql += "SELECT ";
    if (distinct) {
        sql += "DISTINCT ";
    }
    let select = "";
    if (columns) {
        select = parseColumns(columns);
    }
    if (subQueries && subQueries.length) {
        for (let i = 0; i < subQueries.length; i++) {
            if (select)
                select += ", ";
            select += "(" + subQueries[i].query + ")";
            if (subQueries[i].as) {
                select += " AS " + subQueries[i].as;
            }
        }
    }
    if (aggregates && aggregates.length) {
        for (let i = 0; i < aggregates.length; i++) {
            const agg = aggregates[i];
            let alias = agg.alias;
            for (const func in agg) {
                if (func === "alias")
                    continue;
                if (!Object.prototype.hasOwnProperty.call(agg, func))
                    continue;
                const col = agg[func];
                if (!col)
                    continue;
                if (select)
                    select += ", ";
                if (!alias) {
                    alias = aggregates_alias[func] || func;
                }
                select += func + "(" + col + ") AS " + alias;
            }
        }
    }
    if (!select) {
        select = "*";
    }
    sql += select + ` FROM ${main_table}`;
    if (joins) {
        sql += parseJoins(joins);
    }
    if (where) {
        sql += ` WHERE ${where}`;
    }
    if (groupBy) {
        sql += parseGroupBy(groupBy);
    }
    if (having) {
        sql += ` HAVING ${having}`;
    }
    if (sort) {
        sql += parseSort(sort);
    }
    if (limitSkip?.limit) {
        sql += ` LIMIT ${limitSkip.limit}`;
    }
    if (limitSkip?.skip) {
        sql += ` OFFSET ${limitSkip.skip}`;
    }
    sql += ";";
    return sql;
}
