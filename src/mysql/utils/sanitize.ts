import { Buffer } from "node:buffer";
/**
 * Sanitize input to prevent SQL injection.
 * @param input - The user input to be sanitized.
 * @returns Escaped and safe input for MySQL queries.
 */
export function sanitize(input: any): string {
  return escape(input);
}

/**
 * Escape special characters in a string to prevent SQL injection.
 * @param value - The value to be escaped.
 * @returns The escaped string.
 */

export function escape(val: any) {
  if (val == null) return 'NULL';

  const t = typeof val;
  if (t === 'number') return '' + val;
  if (t === 'boolean') return val ? '1' : '0';

  function escStr(str: string) {
    let s = "'";
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      switch (c) {
        case 0: s += '\\0'; break;
        case 8: s += '\\b'; break;
        case 9: s += '\\t'; break;
        case 26: s += '\\z'; break;
        case 10: s += '\\n'; break;
        case 13: s += '\\r'; break;
        case 34: s += '\\"'; break;
        case 39: s += "\\'"; break;
        case 92: s += '\\\\'; break;
        case 37: s += '\\%'; break;
        default: s += String.fromCharCode(c);
      }
    }
    return s + "'";
  }
  if (t === 'string') return escStr(val)
  // default: s += String.fromCharCode(c);

  if (t === 'object') {
    if (val instanceof Date) return `'${val.toISOString()}'`;
    if (Array.isArray(val)) {
      let s = '(';
      for (let i = 0; i < val.length; i++) {
        if (i > 0) s += ', ';
        s += escape(val[i]);
      }
      return s + ')';
    }

    if (Buffer.isBuffer(val)) return `'${val.toString('hex')}'`;

    if (typeof val.toSqlString === 'function') {
      return val.toSqlString();
    }

    // JSON.stringify and replace single quotes in low-level manner:
    const json = JSON.stringify(val);
    let res = "'";
    for (let i = 0; i < json.length; i++) {
      const ch = json.charCodeAt(i);
      if (ch === 39) res += "\\'"; // '
      else res += String.fromCharCode(ch);
    }
    return res + "'";
  }

  // fallback for symbol, bigint, etc.
  const str = String(val);
  let res = "'";
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    if (ch === 39) res += "\\'";
    else res += String.fromCharCode(ch);
  }
  return res + "'";
}

/**
 * Formats a query string by replacing placeholders (`?`) with escaped values.
 * @param query - The base SQL query with placeholders.
 * @param values - Array of values to replace placeholders.
 * @returns The formatted query string.
 */
export function format(query: string, values: any[]): string {
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

export interface MySQLConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  params: Record<string, any>;
}

export function parseMySQLUrl(url: string): MySQLConfig {
  const regex = /^(mysql:\/\/)([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/;

  const match = url.match(regex);
  if (!match) {
    throw new Error("Invalid MySQL URL format");
  }
  const [, , user, password, host, port, database, queryParams] = match;

  const params: { [key: string]: string } = {};

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
    port: port ? parseInt(port, 10) : 3306, // Default MySQL port is 3306
    database,
    params,
  };
}
