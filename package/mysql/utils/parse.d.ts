import { FindAllParamsType } from "../query/find.js";
import { JoinsType, SortType } from "../types/index.js";
export declare function parseSort<Tables extends string[]>(sort: SortType<Tables>): string;
export declare function parseGroupBy<Tables extends string[]>(groupBy: FindAllParamsType<Tables>["groupBy"]): string;
export declare function parseColumns<Tables extends string[]>(columns: FindAllParamsType<Tables>["columns"]): string;
export declare function parseJoins<Tables extends string[]>(joins: JoinsType<Tables>): string;
