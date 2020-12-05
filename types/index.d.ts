export type CondenseFieldDataArgs = {
    fieldsData: IntermediateTypeMeasurements[];
    uniques: {
        [x: string]: any[];
    };
    totalRows: number;
};
/**
 * Analysis results.
 */
export type TypeSummary = {
    fields: {
        [x: string]: FieldInfo;
    };
    totalRows: number;
};
/**
 * Analysis results.
 */
export type IntermediateTypeSummary = {
    fields: {
        [x: string]: FieldInfo;
    };
    totalRows?: number;
    uniques?: any[];
};
/**
 * Analysis results.
 */
export type TypeAnalysis = {
    Array?: FieldTypeStats;
    Boolean?: FieldTypeStats;
    Currency?: FieldTypeStats;
    Date?: FieldTypeStats;
    Email?: FieldTypeStats;
    Float?: FieldTypeStats;
    Null?: FieldTypeStats;
    Number?: FieldTypeStats;
    Object?: FieldTypeStats;
    ObjectId?: FieldTypeStats;
    String?: FieldTypeStats;
    Timestamp?: FieldTypeStats;
    Unknown?: FieldTypeStats;
    UUID?: FieldTypeStats;
};
/**
 * Analysis tracking state.
 */
export type IntermediateTypeAnalysis = {
    Array?: FieldTypeData;
    Boolean?: FieldTypeData;
    Currency?: FieldTypeData;
    Date?: FieldTypeData;
    Email?: FieldTypeData;
    Float?: FieldTypeData;
    Null?: FieldTypeData;
    Number?: FieldTypeData;
    Object?: FieldTypeData;
    ObjectId?: FieldTypeData;
    String?: FieldTypeData;
    Timestamp?: FieldTypeData;
    Unknown?: FieldTypeData;
    UUID?: FieldTypeData;
};
/**
 * Analysis tracking state.
 */
export type IntermediateTypeMeasurements = {
    Array?: any;
    Boolean?: any;
    Currency?: any;
    Date?: any;
    Email?: any;
    Float?: any;
    Null?: any;
    Number?: any;
    Object?: any;
    ObjectId?: any;
    String?: any;
    Timestamp?: any;
    Unknown?: any;
    UUID?: any;
};
/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldTypeStats` type it will become.
 */
export type FieldTypeData = {
    /**
     * - array of values, pre processing into an AggregateSummary
     */
    value?: number[];
    /**
     * - array of string (or decimal) sizes, pre processing into an AggregateSummary
     */
    length?: number[];
    /**
     * - only applies to Float types. Array of sizes of the value both before and after the decimal.
     */
    precision?: number[];
    /**
     * - only applies to Float types. Array of sizes of the value after the decimal.
     */
    scale?: number[];
    /**
     * - number of times the type was matched
     */
    count?: number;
    /**
     * - absolute priority of the detected TypeName, defined in the object `typeRankings`
     */
    rank?: number;
};
export type FieldTypeStats = {
    /**
     * - summary of array of values, pre processing into an AggregateSummary
     */
    value?: AggregateSummary;
    /**
     * - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
     */
    length?: AggregateSummary;
    /**
     * - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
     */
    precision?: AggregateSummary;
    /**
     * - only applies to Float types. Summary of array of sizes of the value after the decimal.
     */
    scale?: AggregateSummary;
    /**
     * - if enum rules were triggered will contain the detected unique values.
     */
    enum?: string[] | number[];
    /**
     * - number of times the type was matched
     */
    count?: number;
    /**
     * - absolute priority of the detected TypeName, defined in the object `typeRankings`
     */
    rank?: number;
};
export type FieldInfo = {
    /**
     * - field stats organized by type
     */
    types: TypeAnalysis | IntermediateTypeAnalysis;
    /**
     * - is the field nullable
     */
    nullable: boolean;
    /**
     * - is the field unique
     */
    unique: boolean;
    /**
     * - enumeration detected, the values are listed on this property.
     */
    enum?: string[] | number[];
};
/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 */
export type AggregateSummary = {
    min: number;
    max: number;
    mean: number;
    p25: number;
    p33: number;
    p50: number;
    p66: number;
    p75: number;
    p99: number;
};
/**
 * This callback is displayed as a global member.
 */
export type progressCallback = (progress: {
    totalRows: number;
    currentRow: number;
}) => any;
/**
 * @typedef CondenseFieldDataArgs
 * @type {{
 *   fieldsData: IntermediateTypeMeasurements[],
 *   uniques: Object.<string, any[]>,
 *   totalRows: number
 * }}
 */
/**
 * Analysis results.
 * @typedef TypeSummary
 * @type {{
  *  fields: Object.<string, FieldInfo>,
  *  totalRows: number;
  * }}
  */
/**
 * Analysis results.
 * @typedef IntermediateTypeSummary
 * @type {{
  *  fields: Object.<string, FieldInfo>,
  *  totalRows?: number;
  *  uniques?: any[];
  * }}
  */
/**
 * Analysis results.
 * @export
 * @typedef TypeAnalysis
 * @type {{
 *    Array?: FieldTypeStats,
 *    Boolean?: FieldTypeStats,
 *    Currency?: FieldTypeStats,
 *    Date?: FieldTypeStats,
 *    Email?: FieldTypeStats,
 *    Float?: FieldTypeStats,
 *    Null?: FieldTypeStats,
 *    Number?: FieldTypeStats,
 *    Object?: FieldTypeStats,
 *    ObjectId?: FieldTypeStats,
 *    String?: FieldTypeStats,
 *    Timestamp?: FieldTypeStats,
 *    Unknown?: FieldTypeStats,
 *    UUID?: FieldTypeStats,
 *  }}
 */
/**
 * Analysis tracking state.
 * @export
 * @typedef IntermediateTypeAnalysis
 * @type {{
 *    Array?: FieldTypeData,
 *    Boolean?: FieldTypeData,
 *    Currency?: FieldTypeData,
 *    Date?: FieldTypeData,
 *    Email?: FieldTypeData,
 *    Float?: FieldTypeData,
 *    Null?: FieldTypeData,
 *    Number?: FieldTypeData,
 *    Object?: FieldTypeData,
 *    ObjectId?: FieldTypeData,
 *    String?: FieldTypeData,
 *    Timestamp?: FieldTypeData,
 *    Unknown?: FieldTypeData,
 *    UUID?: FieldTypeData,
 *  }}
 */
/**
 * Analysis tracking state.
 * @export
 * @typedef IntermediateTypeMeasurements
 * @type {{
  *    Array?: any,
  *    Boolean?: any,
  *    Currency?: any,
  *    Date?: any,
  *    Email?: any,
  *    Float?: any,
  *    Null?: any,
  *    Number?: any,
  *    Object?: any,
  *    ObjectId?: any,
  *    String?: any,
  *    Timestamp?: any,
  *    Unknown?: any,
  *    UUID?: any,
  *  }}
  */
/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldTypeStats` type it will become.
 * @private
 * @typedef FieldTypeData
 * @type {Object}
 * @property {number[]} [value] - array of values, pre processing into an AggregateSummary
 * @property {number[]} [length] - array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {number[]} [precision] - only applies to Float types. Array of sizes of the value both before and after the decimal.
 * @property {number[]} [scale] - only applies to Float types. Array of sizes of the value after the decimal.
 * @property {number} [count] - number of times the type was matched
 * @property {number} [rank] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */
/**
 *
 * @typedef FieldTypeStats
 * @type {Object}
 * @property {AggregateSummary} [value] - summary of array of values, pre processing into an AggregateSummary
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} [count=0] - number of times the type was matched
 * @property {number} [rank=0] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */
/**
 * @typedef FieldInfo
 * @type {object}
 * @property {TypeAnalysis | IntermediateTypeAnalysis} types - field stats organized by type
 * @property {boolean} nullable - is the field nullable
 * @property {boolean} unique - is the field unique
 * @property {string[]|number[]} [enum] - enumeration detected, the values are listed on this property.
 */
/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 * @typedef AggregateSummary
 * @type {{min: number, max: number, mean: number, p25: number, p33: number, p50: number, p66: number, p75: number, p99: number}}
 */
/**
 * This callback is displayed as a global member.
 * @callback progressCallback
 * @param {{totalRows: number, currentRow: number}} progress - The current progress of processing.
 */
/**
 * schemaBuilder is the main function and where all the analysis & processing happens.
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{ onProgress?: progressCallback, enumMinimumRowCount?: number, enumAbsoluteLimit?: number, enumPercentThreshold?: number, nullableRowsThreshold?: number, uniqueRowsThreshold?: number, strictMatching?: boolean }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
export function schemaBuilder(input: Array<any>, { onProgress, strictMatching, enumMinimumRowCount, enumAbsoluteLimit, enumPercentThreshold, nullableRowsThreshold, uniqueRowsThreshold }?: {
    onProgress?: progressCallback;
    enumMinimumRowCount?: number;
    enumAbsoluteLimit?: number;
    enumPercentThreshold?: number;
    nullableRowsThreshold?: number;
    uniqueRowsThreshold?: number;
    strictMatching?: boolean;
}): Promise<TypeSummary>;
/**
 * @param {IntermediateTypeMeasurements[]} typeSizeData
 * @returns {IntermediateTypeAnalysis}
 */
export function pivotFieldDataByType(typeSizeData: IntermediateTypeMeasurements[]): IntermediateTypeAnalysis;
/**
 * Accepts an array of numbers and returns summary data about
 *  the range & spread of points in the set.
 *
 * @param {number[]} numbers - sequence of unsorted data points
 * @returns {AggregateSummary}
 */
export function getNumberRangeStats(numbers: number[], useSortedDataForPercentiles?: boolean): AggregateSummary;
/**
 * @param {string | number | Date | undefined | any} date
 * @returns {Date | false}
 */
export function isValidDate(date: string | number | Date | undefined | any): Date | false;
