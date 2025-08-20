import { sanitize } from "./sanitize.js";
function handlePattern(value, operator) {
    const escapeRegexp = (str) => {
        const specialChars = new Set(['.', '*', '+', '?', '^', '=', '!', ':', '$', '{', '}', '(', ')', '|', '[', ']', '/', '\\']);
        let result = "'";
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (specialChars.has(ch)) {
                result += '\\' + ch;
            }
            else {
                result += ch;
            }
        }
        result += "'";
        return result;
    };
    switch (operator) {
        case "REGEXP": {
            let replaced = "";
            for (let i = 0; i < value.length; i++) {
                const ch = value[i];
                if (ch === '%') {
                    replaced += ".*";
                }
                else if (ch === '_') {
                    replaced += ".";
                }
                else {
                    replaced += ch;
                }
            }
            return escapeRegexp(replaced);
        }
        case "LIKE":
        case "NOT LIKE": {
            let escaped = "'";
            for (let i = 0; i < value.length; i++) {
                switch (value.charCodeAt(i)) {
                    case 0:
                        escaped += "\\0";
                        break;
                    case 8:
                        escaped += "\\b";
                        break;
                    case 9:
                        escaped += "\\t";
                        break;
                    case 26:
                        escaped += "\\z";
                        break;
                    case 10:
                        escaped += "\\n";
                        break;
                    case 13:
                        escaped += "\\r";
                        break;
                    case 34:
                        escaped += '\\"';
                        break;
                    case 39:
                        escaped += "\\'";
                        break;
                    case 92:
                        escaped += "\\\\";
                        break;
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
function splitColumn(str) {
    const dotIndex = str.indexOf(".");
    if (dotIndex === -1) {
        return [str, null];
    }
    return [str.slice(0, dotIndex), str.slice(dotIndex + 1)];
}
export function condition(filters, joinBy = "AND") {
    if (!filters || typeof filters !== "object")
        return "";
    let conditions = "";
    for (let column in filters) {
        const value = filters[column];
        if (column === "$and") {
            const subCondition = condition(value, "AND");
            if (subCondition) {
                if (conditions)
                    conditions += ` ${joinBy} `;
                conditions += `(${subCondition})`;
            }
        }
        else if (column == "$or") {
            const subCondition = condition(value, "OR");
            if (subCondition) {
                if (conditions)
                    conditions += ` ${joinBy} `;
                conditions += `(${subCondition})`;
            }
        }
        else if (typeof value == "object" && value) {
            let [t, col] = splitColumn(column);
            if (col) {
                col = `${t}.\`${col}\``;
            }
            else {
                col = `\`${column}\``;
            }
            let part = "";
            if (Array.isArray(value)) {
                part = `${col} IN ${sanitize(value)}`;
            }
            else {
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
                        if (i > 0)
                            orPart += " OR ";
                        orPart += condition({ [column]: value.$or[i] }, "OR");
                    }
                    part = `(${orPart})`;
                }
                if (Array.isArray(value?.$and) && value?.$and.length) {
                    let andPart = "";
                    for (let i = 0; i < value.$and.length; i++) {
                        if (i > 0)
                            andPart += " AND ";
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
                    if (conditions)
                        conditions += ` ${joinBy} `;
                    conditions += part;
                }
            }
        }
        else if (typeof value === "string" || typeof value === "number" || value == null || value == undefined) {
            let [t, col] = splitColumn(column);
            if (col) {
                column = `${t}.\`${col}\``;
            }
            else {
                column = `\`${column}\``;
            }
            if (conditions)
                conditions += ` ${joinBy} `;
            conditions += `${column} = ${sanitize(value)}`;
        }
    }
    return conditions;
}
