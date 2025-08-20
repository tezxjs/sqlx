import { escape } from "../utils/index.js";

/**
 * Options for creating insert queries.
 */
export type CreateOptionsType = {
    /**
     * Unique column (or group of columns) to use with `ON CONFLICT`.
     * Example: "id" OR "(id, email)"
     */
    uniqueColumn?: string | null;

    /**
     * List of column names to update if a conflict is found.
     * Used with `ON CONFLICT ... DO UPDATE SET`.
     */
    onDuplicateUpdateFields?: string[];
};

export type Value =
    | "CURRENT_TIMESTAMP"
    | string
    | number
    | null
    | undefined;

export type CreateParamsType<Columns extends readonly string[]> =
    | { [P in Columns[number]]?: Value }
    | Array<{ [P in Columns[number]]?: Value }>;

/**
 * Generates a raw SQL insert query string (PostgreSQL version).
 */
export function insert<Columns extends readonly string[]>(
    table: string,
    values: CreateParamsType<Columns>,
    options?: CreateOptionsType,
): string {
    if (!values) throw new Error("❌ Insert data is empty");

    const sanitize = (value: Value): string => {
        if (value === "CURRENT_TIMESTAMP") return value;
        if (value == null || value == undefined) return "NULL";
        if (typeof value === "string") return escape(value);
        return String(value);
    };

    const single = (row: Record<string, any>) => {
        let cols = "";
        let vals = "";
        let i = 0;

        for (const key in row) {
            if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
            if (i > 0) {
                cols += ", ";
                vals += ", ";
            }
            cols += key;
            vals += sanitize(row[key]);
            i++;
        }

        if (!i) throw new Error("❌ Empty row object passed");

        return [`(${cols})`, `(${vals})`] as const;
    };

    let col = "";
    let val = "";

    if (Array.isArray(values)) {
        if (!values.length) throw new Error("❌ Insert data array is empty");

        // get keys from first row
        const firstRow = values[0];
        let keys: string[] = [];
        let i = 0;
        for (const k in firstRow) {
            if (!Object.prototype.hasOwnProperty.call(firstRow, k)) continue;
            keys.push(k);
            if (i > 0) col += ", ";
            col += k;
            i++;
        }
        col = `(${col})`;

        let parts = "";
        for (let r = 0; r < values.length; r++) {
            const row = values[r];
            if (r > 0) parts += ", ";
            parts += "(";
            for (let j = 0; j < keys.length; j++) {
                if (j > 0) parts += ", ";
                parts += sanitize((row as any)[keys[j]]);
            }
            parts += ")";
        }
        val = parts;
    } else {
        [col, val] = single(values);
    }

    // Construct final query (Postgres style)
    if (options?.uniqueColumn && !options?.onDuplicateUpdateFields?.length) {
        // INSERT IGNORE equivalent
        return `INSERT INTO ${table} ${col} VALUES ${val} ON CONFLICT (${options.uniqueColumn}) DO NOTHING;`;
    } else if (options?.uniqueColumn && options?.onDuplicateUpdateFields?.length) {
        // ON DUPLICATE KEY UPDATE equivalent
        let updates = "";
        for (let i = 0; i < options.onDuplicateUpdateFields.length; i++) {
            if (i > 0) updates += ", ";
            const f = options.onDuplicateUpdateFields[i];
            updates += `${f} = EXCLUDED.${f}`;
        }
        return `INSERT INTO ${table} ${col} VALUES ${val} ON CONFLICT (${options.uniqueColumn}) DO UPDATE SET ${updates};`;
    } else {
        return `INSERT INTO ${table} ${col} VALUES ${val};`;
    }
}
