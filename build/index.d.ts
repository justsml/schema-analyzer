declare function isValidDate(date: string | Date | any): boolean;
export declare type TypeDescriptorName = 'enum' | 'nullable' | 'unique';
export declare type TypeNameString = '$ref' | 'Unknown' | 'ObjectId' | 'UUID' | 'Boolean' | 'Date' | 'Timestamp' | 'Currency' | 'Float' | 'Number' | 'Email' | 'String' | 'Array' | 'Object' | 'Null';
export interface ISchemaAnalyzerOptions {
    onProgress?: progressCallback | undefined;
    enumMinimumRowCount?: number | undefined;
    enumAbsoluteLimit?: number | undefined;
    enumPercentThreshold?: number | undefined;
    nullableRowsThreshold?: number | undefined;
    uniqueRowsThreshold?: number | undefined;
    strictMatching?: boolean | undefined;
    disableNestedTypes?: boolean | undefined;
    bogusSizeThreshold?: number | undefined;
}
/**
 * Includes the results of main top-level schema.
 */
export declare type TypeSummary = {
    fields: {
        [x: string]: FieldInfo;
    };
    totalRows: number;
    nestedTypes?: {
        [x: string]: TypeSummary;
    } | undefined;
};
export declare type TypedFieldObject<T> = {
    $ref?: T | undefined;
    Unknown?: T | undefined;
    ObjectId?: T | undefined;
    UUID?: T | undefined;
    Boolean?: T | undefined;
    Date?: T | undefined;
    Timestamp?: T | undefined;
    Currency?: T | undefined;
    Float?: T | undefined;
    Number?: T | undefined;
    Email?: T | undefined;
    String?: T | undefined;
    Array?: T | undefined;
    Object?: T | undefined;
    Null?: T | undefined;
};
/**
 * Describes one or more potential types discovered for a field. The `types` object will have a `$ref` key if any nested structures were found.
 */
export declare type FieldInfo = {
    identity?: boolean;
    uniqueCount?: number;
    /** field stats organized by type */
    types: TypedFieldObject<FieldTypeSummary>;
    /** is the field nullable */
    nullable?: boolean;
    /** is the field unique */
    unique?: boolean;
    /** enumeration detected, the values are listed on this property. */
    enum?: string[] | number[] | undefined;
};
/**
 * Contains stats for a given field's (potential) type.
 *
 * TODO: Add string property for the type name.
 *    We currently uses object key structure: {"String": FieldTypeSummary}
 */
export declare type FieldTypeSummary = {
    /** for nested type support. */
    typeAlias?: string | undefined;
    /** extracted field values, placed into an array. This simplifies (at expense of memory) type analysis and summarization when creating the `AggregateSummary`. */
    value?: AggregateSummary | undefined;
    /** summary of array of string (or decimal) sizes, pre processing into an AggregateSummary */
    length?: AggregateSummary | undefined;
    /** only applies to Float types. Summary of array of sizes of the value both before and after the decimal. */
    precision?: AggregateSummary | undefined;
    /** only applies to Float types. Summary of array of sizes of the value after the decimal. */
    scale?: AggregateSummary | undefined;
    /** if enum rules were triggered will contain the detected unique values. */
    enum?: string[] | number[] | undefined;
    /** number of times the type was matched */
    count: number;
    /** absolute priority of the detected TypeName, defined in the object `typeRankings` */
    rank: number;
};
/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
 */
export declare type InternalFieldTypeData = {
    /** array of values, pre processing into an AggregateSummary */
    value?: any[] | undefined;
    /** array of string (or decimal) sizes, pre processing into an AggregateSummary */
    length?: number[] | undefined;
    /** only applies to Float types. Array of sizes of the value both before and after the decimal. */
    precision?: number[] | undefined;
    /** only applies to Float types. Array of sizes of the value after the decimal. */
    scale?: number[] | undefined;
    /** number of times the type was matched */
    count?: number | undefined;
    /** absolute priority of the detected TypeName, defined in the object `typeRankings` */
    rank?: number | undefined;
};
/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 */
export declare type AggregateSummary<T = number> = {
    min: T;
    max: T;
    mean: T;
    p25: T;
    p33: T;
    p50: T;
    p66: T;
    p75: T;
    p99: T;
};
/**
 * This callback is displayed as a global member.
 */
export declare type progressCallback = (progress: {
    totalRows: number;
    currentRow: number;
}) => any;
/**
 * Returns a fieldName keyed-object with type detection summary data.
 *
 * ### Example `fieldSummary`:
 * ```
 * {
 *  "id": {
 *    "UUID": {
 *      "rank": 2,
 *      "count": 25
 *    },
 *    "Number": {
 *      "rank": 8,
 *      "count": 1,
 *      "value": {
 *        "min": 9999999,
 *        "mean": 9999999,
 *        "max": 9999999,
 *        "p25": 9999999,
 *        "p33": 9999999,
 *        "p50": 9999999,
 *        "p66": 9999999,
 *        "p75": 9999999,
 *        "p99": 9999999
 *      }
 *    }
 *  }
 * }
 * ```
 */
declare function schemaAnalyzer(schemaName: string, input: Array<Object>, options?: ISchemaAnalyzerOptions | undefined): Promise<{
    fields: {
        [k: string]: FieldInfo;
    };
    totalRows: number;
    nestedTypes: {} | undefined;
}>;
/**
 * Returns a fieldName keyed-object with type detection summary data.
 *
 * ### Example `fieldSummary`:
 * ```
 * {
 *  "id": {
 *    "UUID": {
 *      "rank": 2,
 *      "count": 25
 *    },
 *    "Number": {
 *      "rank": 8,
 *      "count": 1,
 *      "value": {
 *        "min": 9999999,
 *        "mean": 9999999,
 *        "max": 9999999,
 *        "p25": 9999999,
 *        "p33": 9999999,
 *        "p50": 9999999,
 *        "p66": 9999999,
 *        "p75": 9999999,
 *        "p99": 9999999
 *      }
 *    }
 *  }
 * }
 * ```
 */
declare function condenseFieldData(schema: {
    fieldsData: {
        [x: string]: InternalFieldTypeData[];
    };
    uniques: {
        [x: string]: any[];
    };
    totalRows: number;
}): {
    fields: {
        [x: string]: TypedFieldObject<FieldTypeSummary>;
    };
    uniques: {
        [x: string]: any[];
    };
    totalRows: number;
};
declare function pivotFieldDataByType(typeSizeData: InternalFieldTypeData[]): InternalFieldTypeData;
/**
 * Accepts an array of numbers and returns summary data about
 *  the range & spread of points in the set.
 *
 * @param {number[]} numbers - sequence of unsorted data points
 * @returns {AggregateSummary}
 */
declare function getNumberRangeStats(numbers: number[], useSortedDataForPercentiles?: boolean): {
    min: number;
    mean: number;
    max: number;
    p25: number;
    p33: number;
    p50: number;
    p66: number;
    p75: number;
    p99: number;
} | undefined;
/**
 *
 */
declare function formatRangeStats(stats: any, formatter: any): {
    min: any;
    mean: any;
    max: any;
    p25: any;
    p33: any;
    p50: any;
    p66: any;
    p75: any;
    p99: any;
};
export { condenseFieldData as _condenseFieldData, pivotFieldDataByType as _pivotFieldDataByType, getNumberRangeStats as _getNumberRangeStats, formatRangeStats as _formatRangeStats, schemaAnalyzer, isValidDate as _isValidDate };
