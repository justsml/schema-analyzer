import { FieldInfo, TypeDescriptorName, TypeNameString } from "../index";
export interface ITypeMatcher {
    type: TypeNameString;
    check: (value: any, fieldName?: string) => boolean | void | undefined;
    supercedes?: TypeNameString[];
}
export interface IAdvancedTypeMatcher {
    type: TypeDescriptorName;
    check: (value: FieldInfo, state: IProcessState<any>, options: IAdvancedMatcherOptions) => FieldInfo;
    matchBasicTypes?: TypeNameString[];
}
export interface IProcessState<T> {
    rowCount: number;
    uniques: T[];
}
export declare type IAdvancedMatcherOptions = Partial<IAdvancedMatcherOptionsEnum & IAdvancedMatcherOptionsUnique & IAdvancedMatcherOptionsNullable>;
export declare type IAdvancedMatcherOptionsEnum = {
    enumAbsoluteLimit: number;
    enumPercentThreshold: number;
};
export declare type IAdvancedMatcherOptionsUnique = {
    uniqueRowsThreshold: number;
};
export declare type IAdvancedMatcherOptionsNullable = {
    nullableRowsThreshold: number;
};
/**
 * Returns an array of TypeName.
 */
declare function detectTypes(value: any, strictMatching?: boolean): TypeNameString[];
declare const MetaChecks: {
    TYPE_UNIQUE: IAdvancedTypeMatcher;
    TYPE_ENUM: IAdvancedTypeMatcher;
    TYPE_NULLABLE: IAdvancedTypeMatcher;
};
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
declare const TYPE_UNKNOWN: ITypeMatcher;
declare const TYPE_OBJECT_ID: ITypeMatcher;
declare const TYPE_UUID: ITypeMatcher;
declare const TYPE_BOOLEAN: ITypeMatcher;
declare const TYPE_DATE: ITypeMatcher;
declare const TYPE_TIMESTAMP: ITypeMatcher;
declare const TYPE_CURRENCY: ITypeMatcher;
declare const TYPE_FLOAT: ITypeMatcher;
declare const TYPE_NUMBER: ITypeMatcher;
declare const TYPE_EMAIL: ITypeMatcher;
declare const TYPE_STRING: ITypeMatcher;
declare const TYPE_ARRAY: ITypeMatcher;
declare const TYPE_OBJECT: ITypeMatcher;
declare const TYPE_NULL: ITypeMatcher;
declare const prioritizedTypes: ITypeMatcher[];
/**
 * Type Rank Map: Use to sort Lowest to Highest
 */
declare const typeRankings: {
    [x: string]: number;
};
export { typeRankings, prioritizedTypes, detectTypes, MetaChecks, TYPE_UNKNOWN, TYPE_OBJECT_ID, TYPE_UUID, TYPE_BOOLEAN, TYPE_DATE, TYPE_TIMESTAMP, TYPE_CURRENCY, TYPE_FLOAT, TYPE_NUMBER, TYPE_NULL, TYPE_EMAIL, TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT, };
