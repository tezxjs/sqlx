
```ts
// 📂 example.ts

// Import the insert function from your library
import { insert } from "@tezx/sqlx/mysql";

/**
 * Assume we have a MySQL table defined as:
 * 
 * CREATE TABLE users (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   name VARCHAR(100),
 *   email VARCHAR(100),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 */

// 1️⃣ Insert a single row
const singleRowQuery = insert<["name", "email", "created_at"]>(
  "users", // table name
  {
    name: "Rakibul Islam",
    email: "rakib@example.com",
    created_at: "CURRENT_TIMESTAMP", // Using raw SQL keyword here
  }
);

console.log(singleRowQuery);
// Output:
// INSERT INTO users (name, email, created_at) VALUES ('Rakibul Islam', 'rakib@example.com', CURRENT_TIMESTAMP);


// 2️⃣ Insert multiple rows
const multipleRowsQuery = insert<["name", "email", "created_at"]>(
  "users",
  [
    {
      name: "Alice",
      email: "alice@example.com",
      created_at: "CURRENT_TIMESTAMP",
    },
    {
      name: "Bob",
      email: "bob@example.com",
      created_at: "CURRENT_TIMESTAMP",
    },
  ]
);

console.log(multipleRowsQuery);
// Output:
// INSERT INTO users (name, email, created_at) VALUES ('Alice', 'alice@example.com', CURRENT_TIMESTAMP), ('Bob', 'bob@example.com', CURRENT_TIMESTAMP);


// 3️⃣ Insert with INSERT IGNORE to prevent duplicates on a unique column
const insertIgnoreQuery = insert<["email", "name"]>(
  "users",
  {
    email: "alice@example.com",
    name: "Alice Updated",
  },
  {
    uniqueColumn: "email", // Use INSERT IGNORE to skip duplicates based on this column
  }
);

console.log(insertIgnoreQuery);
// Output:
// INSERT IGNORE INTO users (email, name) VALUES ('alice@example.com', 'Alice Updated');


// 4️⃣ Insert with ON DUPLICATE KEY UPDATE to update fields if duplicate key exists
const insertOnDuplicateQuery = insert<["email", "name"]>(
  "users",
  {
    email: "bob@example.com",
    name: "Bob Updated",
  },
  {
    onDuplicateUpdateFields: ["name"], // Update 'name' field if duplicate key found
  }
);

console.log(insertOnDuplicateQuery);
// Output:
// INSERT INTO users (email, name) VALUES ('bob@example.com', 'Bob Updated') ON DUPLICATE KEY UPDATE name = VALUES(name);

```

---
নিশ্চিত! নিচে তোমার `destroy` ফাংশনের **English commented full example** দিলাম, যেটা তোমার `@tezx/sqlx/mysql` বা যেকোনো জায়গায় ব্যবহার করতে পারবে —

---

```ts
// 📂 example-destroy.ts

import { destroy } from "@tezx/sqlx/mysql"; // adjust path as per your setup

/**
 * Example: Assume we have the following tables:
 * 
 * users (id, name, email)
 * posts (id, user_id, title, content, created_at)
 * 
 * We want to delete posts by a specific user with optional joins and sorting.
 */

// 1️⃣ Simple delete with WHERE clause only
const simpleDeleteQuery = destroy(
  "posts", // main table
  {
    where: "user_id = 5", // condition to delete posts of user with id=5
  }
);

console.log(simpleDeleteQuery);
// Output:
// DELETE posts FROM posts WHERE user_id = 5;

// 2️⃣ Delete with JOIN to related table (e.g., delete posts joining users)
const deleteWithJoinQuery = destroy(
  "posts",
  {
    where: "users.status = 'inactive' AND posts.user_id = users.id",
    joins: [
      {
        type: "INNER JOIN",
        table: "users",
        on: "posts.user_id = users.id",
      },
    ],
  }
);

console.log(deleteWithJoinQuery);
// Output:
// DELETE posts FROM posts INNER JOIN users ON posts.user_id = users.id WHERE users.status = 'inactive' AND posts.user_id = users.id;

// 3️⃣ Delete with sorting and limit (e.g., delete oldest 10 posts)
const deleteWithSortLimitQuery = destroy(
  "posts",
  {
    where: "user_id = 5",
    sort: { column: "created_at", order: "ASC" }, // delete oldest posts first
    limit: 10, // only 10 rows
  }
);

console.log(deleteWithSortLimitQuery);
// Output:
// DELETE posts FROM posts WHERE user_id = 5 ORDER BY created_at ASC LIMIT 10;
```

---

### Explanation

* `table`: Main table from which rows will be deleted.
* `where`: SQL condition to specify which rows to delete (mandatory).
* `joins`: Optional array of JOIN clauses — each with type, table, and ON condition.
* `sort`: Optional ORDER BY clause to prioritize rows for deletion.
* `limit`: Optional LIMIT clause to restrict how many rows get deleted.

---

---

```ts
// 📂 example-find.ts

import { find } from "@tezx/sqlx/mysql"; // adjust import path as needed

/**
 * Example: Complex SELECT query generation using `find` function.
 * Assume we have tables:
 * users(id, name, age, city)
 * orders(id, user_id, total, status, created_at)
 * 
 * We want to select users with aggregate order info, filtering, sorting, joins, and pagination.
 */

// Generate a query to find users with:
// - distinct users
// - select specific columns from users and orders
// - join orders on users.id = orders.user_id
// - sum of orders.total as totalSpent
// - only users older than 18
// - grouped by users.id
// - sorted by totalSpent descending
// - limit 10, offset 0
const complexSelectQuery = find<["users", "orders"]>(
  "users",
  {
    distinct: true,
    columns: {
      users: ["id", "name", "age", "city"],
      orders: ["status"],
    },
    aggregates: [
      { SUM: "orders.total", alias: "totalSpent" },
      { COUNT: "orders.id", alias: "orderCount" },
    ],
    joins: [
      {
        type: "LEFT JOIN",
        table: "orders",
        on: "users.id = orders.user_id",
      },
    ],
    where: "users.age > 18",
    groupBy: {
      users: ["id", "name", "age", "city"],
    },
    sort: { column: "totalSpent", order: "DESC" },
    limitSkip: { limit: 10, skip: 0 },
  }
);

console.log(complexSelectQuery);

/*
Output:

WITH RECURSIVE ... (if recursiveCTE is used)

SELECT DISTINCT users.id, users.name, users.age, users.city, orders.status, 
       SUM(orders.total) AS totalSpent, COUNT(orders.id) AS orderCount 
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.age > 18
GROUP BY users.id, users.name, users.age, users.city
ORDER BY totalSpent DESC
LIMIT 10 OFFSET 0;
*/

```

---

### Explanation of the function parameters

* `distinct`: If `true`, adds `DISTINCT` keyword to avoid duplicate rows.
* `columns`: Select specific columns; can specify per table or raw strings.
* `aggregates`: Add aggregate functions like `SUM`, `COUNT` with optional aliases.
* `joins`: Define SQL joins (INNER, LEFT, etc.) with ON conditions.
* `where`: Filtering condition as raw SQL string.
* `groupBy`: Group results by specified columns.
* `having`: Filter groups by aggregate conditions (not used in example).
* `sort`: Order the result by column and order (`ASC` or `DESC`).
* `limitSkip`: Pagination control with `limit` and `skip` (offset).
* `recursiveCTE`: Support recursive common table expressions (optional).
* `subQueries`: Include subqueries in SELECT columns (optional).

---

```ts
// 📂 example-update.ts

import { update } from "@tezx/sqlx/mysql"; // adjust path accordingly

/**
 * Example table: users(id, name, status, points, last_login)
 * 
 * Goal: Update user records with conditional logic, joins, sorting, and limits.
 */

// 1️⃣ Simple update with static values and WHERE condition
const simpleUpdate = update(
  "users",
  {
    values: {
      status: "active",
      points: 100,
    },
    where: "id = 5",
  }
);
console.log(simpleUpdate);
// Output:
// UPDATE users SET status = 'active', points = 100 WHERE id = 5;

// 2️⃣ Update with CASE expression for conditional values
const caseUpdate = update(
  "users",
  {
    values: {
      status: {
        case: [
          { when: "points > 1000", then: "gold" },
          { when: "points > 500", then: "silver" },
        ],
        default: "bronze",
      },
      last_login: null,
    },
    where: "status != 'inactive'",
  }
);
console.log(caseUpdate);
// Output:
// UPDATE users SET status = CASE WHEN points > 1000 THEN 'gold' WHEN points > 500 THEN 'silver' ELSE 'bronze' END, last_login = NULL WHERE status != 'inactive';

// 3️⃣ Update with JOIN and sorting, limiting number of rows updated
const updateWithJoinSortLimit = update(
  "users",
  {
    values: {
      status: "inactive",
    },
    joins: [
      {
        type: "INNER JOIN",
        table: "orders",
        on: "users.id = orders.user_id",
      },
    ],
    where: "orders.created_at < '2024-01-01'",
    sort: { column: "users.last_login", order: "ASC" },
    limit: 10,
  }
);
console.log(updateWithJoinSortLimit);
// Output:
// UPDATE users INNER JOIN orders ON users.id = orders.user_id SET status = 'inactive' WHERE orders.created_at < '2024-01-01' ORDER BY users.last_login ASC LIMIT 10;

// 4️⃣ Update with resetting columns to DEFAULT and calculated fields
const updateWithDefaultsAndCalculations = update(
  "users",
  {
    defaultValues: ["points"],
    setCalculations: {
      last_login: "NOW()",
    },
    where: "id IN (1, 2, 3)",
  }
);
console.log(updateWithDefaultsAndCalculations);
// Output:
// UPDATE users SET points = DEFAULT, last_login = NOW() WHERE id IN (1, 2, 3);
```

---

### Explanation

* `values`: Object of column-value pairs or conditional CASE expressions.
* `defaultValues`: Array of columns to reset to their default values.
* `setCalculations`: Custom SQL expressions to assign to columns.
* `joins`: Array of JOIN clauses for multi-table update.
* `where`: SQL WHERE clause (mandatory).
* `sort`: ORDER BY clause for update prioritization.
* `limit`: LIMIT clause restricting number of updated rows.

---

```ts
import { mysql_datetime, mysql_date } from "@tezx/sqlx/mysql";

// Get current datetime in MySQL format
const nowDatetime = mysql_datetime();
console.log(nowDatetime); // e.g. "2025-08-09 19:32:15"

// Convert specific date string to MySQL date format
const birthday = mysql_date("1990-05-23");
console.log(birthday); // "1990-05-23"

// Convert specific date object to MySQL datetime format
const someDate = new Date("2023-01-15T10:20:30Z");
console.log(mysql_datetime(someDate)); // "2023-01-15 10:20:30"
```

---

```ts
import { escape, format, sanitize, parseMySQLUrl } from "@tezx/sqlx/mysql";

// Example: escaping a string
const userInput = "O'Reilly";
const safeValue = escape(userInput);
console.log(safeValue); // Outputs: 'O\'Reilly'

// Example: formatting a query with placeholders
const query = "SELECT * FROM users WHERE name = ? AND age > ?";
const formattedQuery = format(query, ["Alice", 30]);
console.log(formattedQuery); // SELECT * FROM users WHERE name = 'Alice' AND age > 30

// Example: parsing a MySQL connection URL
const config = parseMySQLUrl("mysql://user:pass@localhost:3306/mydb?charset=utf8mb4");
console.log(config);
/*
{
  user: "user",
  password: "pass",
  host: "localhost",
  port: 3306,
  database: "mydb",
  params: { charset: "utf8mb4" }
}
*/
```

---

### Summary

* `escape(val)` safely escapes strings, numbers, booleans, arrays, dates, buffers, and JSON objects to prevent SQL injection.
* `format(query, values)` replaces all `?` placeholders in a query with properly escaped values.
* `sanitize(input)` is an alias for `escape` (could be used as semantic convenience).
* `parseMySQLUrl(url)` parses MySQL connection URLs into a config object usable for DB clients.

---
