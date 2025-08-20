"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insert = insert;
const index_js_1 = require("../utils/index.js");
function insert(table, values, options) {
    if (!values)
        throw new Error("❌ Insert data array is empty");
    let col = "";
    let val = "";
    const sanitize = (value) => {
        if (value === "CURRENT_TIMESTAMP")
            return value;
        if (value == null)
            return "NULL";
        if (value == undefined)
            return "NULL";
        if (typeof value === "string")
            return (0, index_js_1.escape)(value);
        return String(value);
    };
    const single = (row) => {
        let c = "", v = "", i = 0;
        for (const key in row) {
            if (!Object.prototype.hasOwnProperty.call(row, key))
                continue;
            const s = sanitize(row[key]);
            if (i++ > 0) {
                c += ", ";
                v += ", ";
            }
            c += key;
            v += s;
        }
        if (!i)
            throw new Error("❌ Empty row object passed");
        return [`(${c})`, `(${v})`];
    };
    if (Array.isArray(values)) {
        let colKeys = "";
        let firstRow = values[0];
        let keys = [];
        for (const k in firstRow) {
            if (!Object.prototype.hasOwnProperty.call(firstRow, k))
                continue;
            keys.push(k);
            colKeys += colKeys ? `, ${k}` : k;
        }
        col = `(${colKeys})`;
        let parts = "";
        for (let i = 0; i < values.length; i++) {
            if (i > 0)
                parts += ", ";
            const row = values[i];
            let inner = "";
            for (let j = 0; j < keys.length; j++) {
                if (j > 0)
                    inner += ", ";
                inner += sanitize(row[keys[j]]);
            }
            parts += `(${inner})`;
        }
        val = parts;
    }
    else {
        [col, val] = single(values);
    }
    if (options?.uniqueColumn) {
        return `INSERT IGNORE INTO ${table} ${col} VALUES ${val};`;
    }
    else if (options?.onDuplicateUpdateFields?.length) {
        let sql = `INSERT INTO ${table} ${col} VALUES ${val} ON DUPLICATE KEY UPDATE `;
        const fields = options.onDuplicateUpdateFields;
        for (let i = 0; i < fields.length; i++) {
            if (i > 0)
                sql += ", ";
            sql += `${fields[i]} = VALUES(${fields[i]})`;
        }
        sql += ";";
        return sql;
    }
    else {
        return `INSERT INTO ${table} ${col} VALUES ${val};`;
    }
}
