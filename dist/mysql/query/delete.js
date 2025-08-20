import { parseJoins, parseSort } from "../utils/parse.js";
export function destroy(table, { where, joins, limit, sort }) {
    if (!table) {
        throw new Error("⚠️ The `table` parameter is required.");
    }
    if (!where) {
        throw new Error("⚠️ The `where` parameter is required.");
    }
    let query = `DELETE ${table} FROM ${table}`;
    query += joins ? parseJoins(joins) : "";
    if (where) {
        query += ` WHERE ${where}`;
    }
    if (sort) {
        query += parseSort(sort);
    }
    if (limit) {
        query += ` LIMIT ${limit}`;
    }
    return `${query};`;
}
