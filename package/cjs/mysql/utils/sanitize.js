"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
exports.escape = escape;
exports.format = format;
exports.parseMySQLUrl = parseMySQLUrl;
const node_buffer_1 = require("node:buffer");
function sanitize(input) {
    return escape(input);
}
function escape(val) {
    if (val == null)
        return 'NULL';
    const t = typeof val;
    if (t === 'number')
        return '' + val;
    if (t === 'boolean')
        return val ? '1' : '0';
    function escStr(str) {
        let s = "'";
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            switch (c) {
                case 0:
                    s += '\\0';
                    break;
                case 8:
                    s += '\\b';
                    break;
                case 9:
                    s += '\\t';
                    break;
                case 26:
                    s += '\\z';
                    break;
                case 10:
                    s += '\\n';
                    break;
                case 13:
                    s += '\\r';
                    break;
                case 34:
                    s += '\\"';
                    break;
                case 39:
                    s += "\\'";
                    break;
                case 92:
                    s += '\\\\';
                    break;
                case 37:
                    s += '\\%';
                    break;
                default: s += String.fromCharCode(c);
            }
        }
        return s + "'";
    }
    if (t === 'string')
        return escStr(val);
    if (t === 'object') {
        if (val instanceof Date)
            return `'${val.toISOString()}'`;
        if (Array.isArray(val)) {
            let s = '(';
            for (let i = 0; i < val.length; i++) {
                if (i > 0)
                    s += ', ';
                s += escape(val[i]);
            }
            return s + ')';
        }
        if (node_buffer_1.Buffer.isBuffer(val))
            return `'${val.toString('hex')}'`;
        if (typeof val.toSqlString === 'function') {
            return val.toSqlString();
        }
        const json = JSON.stringify(val);
        let res = "'";
        for (let i = 0; i < json.length; i++) {
            const ch = json.charCodeAt(i);
            if (ch === 39)
                res += "\\'";
            else
                res += String.fromCharCode(ch);
        }
        return res + "'";
    }
    const str = String(val);
    let res = "'";
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        if (ch === 39)
            res += "\\'";
        else
            res += String.fromCharCode(ch);
    }
    return res + "'";
}
function format(query, values) {
    let i = 0;
    return query.replace(/\?/g, () => {
        if (i >= values.length) {
            throw new Error("Insufficient values provided for placeholders.");
        }
        const escapedValue = escape(values[i]);
        i++;
        return escapedValue;
    });
}
function parseMySQLUrl(url) {
    const regex = /^(mysql:\/\/)([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;
    const match = url.match(regex);
    if (!match) {
        throw new Error("Invalid MySQL URL format");
    }
    const [, , user, password, host, port, database, queryParams] = match;
    const params = {};
    if (queryParams) {
        queryParams.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
    }
    return {
        user,
        password,
        host,
        port: port ? parseInt(port, 10) : 3306,
        database,
        params,
    };
}
