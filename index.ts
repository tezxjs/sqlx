import { escape } from "mysql2"
import { condition } from "./src/mysql/index.js"
console.log(condition({
    test: 34,
    testc: {
        eq: 'test',
        isNull: true
    },
    $and: {
        "test.sdfsdf": {
            like: '/345345/"\t\r'
        }
    }
}))

console.log(escape.toString())