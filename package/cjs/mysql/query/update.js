"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = update;
const index_js_1 = require("../utils/index.js");
const parse_js_1 = require("../utils/parse.js");
function update(table, params) {
    if (!table)
        throw new Error("⚠️ `table` is required.");
    if (!params.where)
        throw new Error("⚠️ `where` is required");
    const { values, defaultValues, setCalculations, fromSubQuery } = params;
    if (!values && !defaultValues?.length && !setCalculations && !fromSubQuery) {
        throw new Error("⚠️ No update data provided.");
    }
    let sql = "UPDATE " + table + (0, parse_js_1.parseJoins)(params.joins || []) + " SET ";
    let firstSet = true;
    function appendSet(column, expr) {
        if (!firstSet)
            sql += ", ";
        else
            firstSet = false;
        sql += column + " = " + expr;
    }
    if (values) {
        for (const col in values) {
            if (!Object.prototype.hasOwnProperty.call(values, col))
                continue;
            const val = values[col];
            if (val && typeof val === "object" && "case" in val) {
                const cases = val.case;
                if (!cases || !cases.length)
                    continue;
                let caseExpr = "CASE ";
                for (let i = 0; i < cases.length; i++) {
                    const c = cases[i];
                    caseExpr += "WHEN " + c.when + " THEN " + (0, index_js_1.escape)(c.then) + " ";
                }
                caseExpr += "ELSE " + (0, index_js_1.escape)(val.default) + " END";
                appendSet(col, caseExpr);
            }
            else {
                appendSet(col, (0, index_js_1.escape)(val));
            }
        }
    }
    if (setCalculations) {
        for (const col in setCalculations) {
            if (!Object.prototype.hasOwnProperty.call(setCalculations, col))
                continue;
            appendSet(col, setCalculations[col]);
        }
    }
    if (fromSubQuery) {
        for (const col in fromSubQuery) {
            if (!Object.prototype.hasOwnProperty.call(fromSubQuery, col))
                continue;
            appendSet(col, fromSubQuery[col]);
        }
    }
    if (defaultValues && defaultValues.length) {
        for (let i = 0; i < defaultValues.length; i++) {
            appendSet(defaultValues[i], "DEFAULT");
        }
    }
    sql += " WHERE " + params.where;
    if (params.sort)
        sql += (0, parse_js_1.parseSort)(params.sort);
    if (params.limit !== undefined && params.limit !== null)
        sql += " LIMIT " + params.limit;
    sql += ";";
    return sql;
}
