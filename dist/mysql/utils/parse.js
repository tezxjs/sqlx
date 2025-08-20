export function parseSort(sort) {
    if (!sort)
        return "";
    if (typeof sort === "string") {
        return ` ORDER BY ${sort}`;
    }
    if (typeof sort === "object") {
        let first = true;
        let out = "";
        for (const table in sort) {
            if (!Object.prototype.hasOwnProperty.call(sort, table))
                continue;
            const columns = sort[table];
            if (typeof columns === "number") {
                if (out)
                    out += ", ";
                out += table + (columns === 1 ? " ASC" : " DESC");
            }
            else if (typeof columns === "object") {
                for (const col in columns) {
                    if (!Object.prototype.hasOwnProperty.call(columns, col))
                        continue;
                    if (out)
                        out += ", ";
                    out += table + "." + col + (columns[col] === 1 ? " ASC" : " DESC");
                }
            }
        }
        if (out)
            return " ORDER BY " + out;
    }
    return "";
}
export function parseGroupBy(groupBy) {
    if (!groupBy)
        return "";
    if (typeof groupBy === "string")
        return ` GROUP BY ${groupBy}`;
    if (Array.isArray(groupBy))
        return ` GROUP BY ${groupBy.join(", ")}`;
    if (typeof groupBy === "object") {
        let out = "";
        for (const table in groupBy) {
            if (!Object.prototype.hasOwnProperty.call(groupBy, table))
                continue;
            const val = groupBy[table];
            if (table === "extra") {
                if (Array.isArray(val) && val.length) {
                    if (out)
                        out += ", ";
                    out += val.join(", ");
                }
                else if (val) {
                    if (out)
                        out += ", ";
                    out += val;
                }
            }
            else if (Array.isArray(val) && val.length) {
                if (out)
                    out += ", ";
                for (let i = 0; i < val.length; i++) {
                    if (i)
                        out += ", ";
                    out += table;
                    out += ".";
                    out += val[i];
                }
            }
        }
        if (out) {
            return " GROUP BY " + out;
        }
    }
    return "";
}
export function parseColumns(columns) {
    if (!columns)
        return "";
    if (typeof columns === "string")
        return columns;
    if (Array.isArray(columns))
        return columns.join(", ");
    if (typeof columns === "object") {
        let out = "";
        for (const table in columns) {
            if (!Object.prototype.hasOwnProperty.call(columns, table))
                continue;
            const col = columns[table];
            if (table === "extra") {
                if (Array.isArray(col)) {
                    if (out)
                        out += ", ";
                    out += col.join(", ");
                }
                else if (col) {
                    if (out)
                        out += ", ";
                    out += col;
                }
            }
            else if (Array.isArray(col) && col.length) {
                if (out)
                    out += ", ";
                for (let i = 0; i < col.length; i++) {
                    if (i)
                        out += ", ";
                    out += table;
                    out += ".";
                    out += col[i];
                }
            }
        }
        return out;
    }
    return "";
}
export function parseJoins(joins) {
    if (!joins)
        return "";
    if (typeof joins === "string") {
        return joins.trim();
    }
    let out = "";
    for (let i = 0; i < joins.length; i++) {
        const { on, table, type } = joins[i];
        if (!table) {
            throw new Error(`❌ Missing table name in join at index ${i}`);
        }
        if (!on) {
            throw new Error(`❌ Missing 'on' condition in join at index ${i}`);
        }
        out += ` ${type || "JOIN"} ${table} ON ${on}`;
    }
    return out.trim();
}
