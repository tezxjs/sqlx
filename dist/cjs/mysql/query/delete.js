"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = destroy;
const parse_js_1 = require("../utils/parse.js");
function destroy(table, { where, joins, limit, sort }) {
    if (!table) {
        throw new Error("⚠️ The `table` parameter is required.");
    }
    if (!where) {
        throw new Error("⚠️ The `where` parameter is required.");
    }
    let query = `DELETE ${table} FROM ${table}`;
    query += joins ? (0, parse_js_1.parseJoins)(joins) : "";
    if (where) {
        query += ` WHERE ${where}`;
    }
    if (sort) {
        query += (0, parse_js_1.parseSort)(sort);
    }
    if (limit) {
        query += ` LIMIT ${limit}`;
    }
    return `${query};`;
}
