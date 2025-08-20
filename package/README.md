# @tezx/sqlx

High-performance **TypeScript SQL builder** for MySQL / MariaDB. Supports dynamic queries, inserts, updates, deletes, complex filtering, aggregates, joins, sorting, pagination, and safe SQL utilities. Works in Node.js, Deno, and Bun.

---

## 🔹 Installation

```bash
# Node.js / Bun
npm install @tezx/sqlx

# Deno
import { insert, find, update, destroy, condition, escape, format } from "https://esm.sh/@tezx/sqlx/mysql";
```

---

## 1️⃣ Insert Queries

```ts
import { insert } from "@tezx/sqlx/mysql";

// Insert a single row
const singleRow = insert<["name","email","created_at"]>(
  "users",
  { name: "Rakibul Islam", email: "rakib@example.com", created_at: "CURRENT_TIMESTAMP" }
);

// Insert multiple rows
const multipleRows = insert<["name","email","created_at"]>(
  "users",
  [
    { name: "Alice", email: "alice@example.com", created_at: "CURRENT_TIMESTAMP" },
    { name: "Bob", email: "bob@example.com", created_at: "CURRENT_TIMESTAMP" },
  ]
);

// Insert with INSERT IGNORE
const insertIgnore = insert<["email","name"]>(
  "users",
  { email: "alice@example.com", name: "Alice Updated" },
  { uniqueColumn: "email" }
);

// Insert with ON DUPLICATE KEY UPDATE
const insertDuplicate = insert<["email","name"]>(
  "users",
  { email: "bob@example.com", name: "Bob Updated" },
  { onDuplicateUpdateFields: ["name"] }
);
```

---

## 2️⃣ Dynamic WHERE / HAVING Conditions

```ts
import { condition } from "@tezx/sqlx/mysql";

const filters = {
  status: "active",
  age: { gte: 18, lte: 65 },
  country: { in: ["US","CA"] },
  $or: { title: { like: "%manager%" }, department: { eq: "HR" } },
  last_login: { isNull: true }
};

const whereClause = condition(filters);
```

---

## 3️⃣ Delete Queries (`destroy`)

```ts
import { destroy } from "@tezx/sqlx/mysql";

// Simple delete
const simpleDelete = destroy("posts", { where: "user_id = 5" });

// Delete with join
const deleteJoin = destroy("posts", {
  where: "users.status = 'inactive' AND posts.user_id = users.id",
  joins: [{ type: "INNER JOIN", table: "users", on: "posts.user_id = users.id" }],
});

// Delete with sort and limit
const deleteLimit = destroy("posts", { where: "user_id = 5", sort: { column: "created_at", order: "ASC" }, limit: 10 });
```

---

## 4️⃣ Update Queries (`update`)

```ts
import { update } from "@tezx/sqlx/mysql";

// Simple update
const simpleUpdate = update("users", { values: { status: "active", points: 100 }, where: "id = 5" });

// Update with CASE expression
const caseUpdate = update("users", {
  values: { 
    status: { case: [{ when: "points > 1000", then: "gold" }, { when: "points > 500", then: "silver" }], default: "bronze" }, 
    last_login: null 
  },
  where: "status != 'inactive'",
});

// Update with JOIN, sort, limit
const updateJoin = update("users", {
  values: { status: "inactive" },
  joins: [{ type: "INNER JOIN", table: "orders", on: "users.id = orders.user_id" }],
  where: "orders.created_at < '2024-01-01'",
  sort: { column: "users.last_login", order: "ASC" },
  limit: 10,
});

// Update default values and calculations
const updateDefaults = update("users", {
  defaultValues: ["points"],
  setCalculations: { last_login: "NOW()" },
  where: "id IN (1,2,3)",
});
```

---

## 5️⃣ Find / Select Queries (`find`)

```ts
import { find } from "@tezx/sqlx/mysql";

const selectQuery = find<["users","orders"]>("users", {
  distinct: true,
  columns: { users: ["id","name","age","city"], orders: ["status"] },
  aggregates: [{ SUM: "orders.total", alias: "totalSpent" }, { COUNT: "orders.id", alias: "orderCount" }],
  joins: [{ type: "LEFT JOIN", table: "orders", on: "users.id = orders.user_id" }],
  where: "users.age > 18",
  groupBy: { users: ["id","name","age","city"] },
  sort: { column: "totalSpent", order: "DESC" },
  limitSkip: { limit: 10, skip: 0 },
});
```

---

## 6️⃣ Date & Datetime Helpers

```ts
import { mysql_datetime, mysql_date } from "@tezx/sqlx/mysql";

mysql_datetime(); // current datetime "YYYY-MM-DD HH:mm:ss"
mysql_date("1990-05-23"); // "1990-05-23"
mysql_datetime(new Date("2023-01-15T10:20:30Z")); // "2023-01-15 10:20:30"
```

---

## 7️⃣ SQL Utilities

```ts
import { escape, format, sanitize, parseMySQLUrl } from "@tezx/sqlx/mysql";

escape("O'Reilly"); // 'O\'Reilly'
format("SELECT * FROM users WHERE name=? AND age>?", ["Alice", 30]);
sanitize("some input"); // alias for escape
parseMySQLUrl("mysql://user:pass@localhost:3306/mydb?charset=utf8mb4");
```

---

### ✅ Summary

* **Dynamic queries**: `insert`, `update`, `destroy`, `find`, `condition`
* **SQL safety**: `escape`, `sanitize`, `format`
* **Date helpers**: `mysql_date`, `mysql_datetime`
* **MySQL URL parsing**: `parseMySQLUrl`

---
