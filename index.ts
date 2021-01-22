import { detectTypes, MetaChecks, typeRankings } from "./utils/type-helpers";
import * as helpers from "./utils/helpers";

export { helpers };

const debug = require("debug");
const log = debug("schema-builder");

// export { schemaAnalyzer, pivotFieldDataByType, getNumberRangeStats, isValidDate }

function isValidDate(date: string | Date | any): false | Date {
  date = date instanceof Date ? date : new Date(date);
  return isNaN(date.getFullYear()) ? false : date;
}

export const parseDate = (date: string | Date | any): string | null => {
  date = isValidDate(date);
  if (date instanceof Date) return date.toISOString();
  return null;
};

export type TypeDescriptorName = "enum" | "nullable" | "unique";
export type TypeNameString =
  | "$ref"
  | "Unknown"
  | "ObjectId"
  | "UUID"
  | "Boolean"
  | "Date"
  | "Timestamp"
  | "Currency"
  | "Float"
  | "Number"
  | "Email"
  | "String"
  | "Array"
  | "Object"
  | "Null";

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
export type TypeSummary<TFieldDetails = FieldInfo> = {
  schemaName?: string;
  fields: {
    [x: string]: TFieldDetails;
  };
  totalRows: number;
  nestedTypes:
    | {
        [x: string]: TypeSummary<TFieldDetails>;
      }
    | undefined;
};

export type TypedFieldObject<T> = {
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
 * Details about a field, including potential types discovered.
 * The `types` object will have a `$ref` key if any nested data types were found.
 * See the `nestedTypes` on `TypeSummary`.
 */
export type FieldInfo = {
  identity?: boolean;
  uniqueCount?: number;
  /** field stats organized by type */
  types: TypedFieldObject<FieldTypeSummary>;
  /** is the field nullable */
  nullable?: boolean;
  nullCount?: number;
  /** is the field unique */
  unique?: boolean;
  /** enumeration detected, the values are listed on this property. */
  enum?: string[] | number[] | undefined;
};

/**
 * Similar to FieldInfo, SimpleFieldInfo omits stats & extra types.
 *
 * This provides a simpler structure for traversing and generating code.
 */
export type SimpleFieldInfo = {
  /** field stats organized by type */
  type: TypeNameString;
  /** Should contain any $ref keys */
  typeRef?: string;
  /** indicates unique identifier or primary key */
  identity?: boolean;
  /** is the field nullable */
  nullable?: boolean;
  /** is the field unique */
  unique?: boolean;
  /** enumeration detected, the values are listed on this property. */
  enum?: string[] | number[] | null;
};

/**
 * Contains stats for a given field's (potential) type.
 *
 * TODO: Add string property for the type name.
 *    We currently uses object key structure: {"String": FieldTypeSummary}
 */
export type FieldTypeSummary = {
  /** for nested type support. */
  typeAlias?: string;
  /** extracted field values, placed into an array. This simplifies (at expense of memory) type analysis and summarization when creating the `AggregateSummary`. */
  value?: AggregateSummary | number;
  /** summary of array of string (or decimal) sizes, pre processing into an AggregateSummary */
  length?: AggregateSummary;
  /** only applies to Float types. Summary of array of sizes of the value both before and after the decimal. */
  precision?: AggregateSummary;
  /** only applies to Float types. Summary of array of sizes of the value after the decimal. */
  scale?: AggregateSummary;
  /** if enum rules were triggered will contain the detected unique values. */
  enum?: string[] | number[];
  /** number of times the type was matched */
  count: number;
  /** absolute priority of the detected TypeName, defined in the object `typeRankings` */
  rank: number;
};
/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
 */
export type InternalFieldTypeData = {
  /** for nested type support. */
  typeAlias?: string | undefined;
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
export type AggregateSummary<T = number> = {
  min: T | undefined;
  max: T | undefined;
  mean: T | undefined;
  p25: T | undefined;
  p33: T | undefined;
  p50: T | undefined;
  p66: T | undefined;
  p75: T | undefined;
  p99: T | undefined;
};
/**
 * This callback is displayed as a global member.
 */
export type progressCallback = (progress: {
  totalRows: number;
  currentRow: number;
}) => any;

const { TYPE_ENUM, TYPE_NULLABLE, TYPE_UNIQUE } = MetaChecks;

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
function schemaAnalyzer(
  schemaName: string,
  input: any[],
  options: ISchemaAnalyzerOptions | undefined = {
    onProgress: ({ totalRows, currentRow }) => {},
    strictMatching: true,
    disableNestedTypes: false,
    enumMinimumRowCount: 25,
    enumAbsoluteLimit: 10,
    enumPercentThreshold: 0.01,
    nullableRowsThreshold: 0.02,
    uniqueRowsThreshold: 0.99,
    bogusSizeThreshold: 0.1,
  }
) {
  if (!Array.isArray(input) || typeof input !== "object")
    throw Error("Input Data must be an Array of Objects");
  if (input.length < 1) throw Error("1 record required. 100+ recommended.");
  if (typeof input[0] !== "object")
    throw Error("Input Data must be an Array of Objects");

  const {
    onProgress = ({ totalRows, currentRow }) => {},
    strictMatching = true,
    disableNestedTypes = false,
    enumMinimumRowCount = 25,
    enumAbsoluteLimit = 10,
    enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 0.99,
  } = options;
  const isEnumEnabled = input.length >= enumMinimumRowCount;
  log(`isEnumEnabled: ${isEnumEnabled}`);
  const nestedData = {};

  const pivotRowsGroupedByType = _pivotRowsGroupedByType({
    schemaName,
    isEnumEnabled,
    disableNestedTypes,
    nestedData,
    strictMatching,
    onProgress,
  });

  log(`Processing '${schemaName}', found ${input.length} rows...`);
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then(async (schema) => {
      log("Built summary from Field Type data.");
      // console.log('Schema', JSON.stringify(schema, null, 2))

      const fields = Object.keys(schema.fields).reduce(
        (fieldInfo, fieldName) => {
          const typesInfo = schema.fields[fieldName]!.types;
          const jobState = {
            rowCount: input.length,
            uniques: schema.uniques[fieldName] ?? [],
          };

          fieldInfo[fieldName] = { types: typesInfo! };
          const fInfo = fieldInfo[fieldName];

          fieldInfo[fieldName] = TYPE_ENUM.check(fInfo!, jobState, options);
          fieldInfo[fieldName] = TYPE_NULLABLE.check(fInfo!, jobState, options);
          fieldInfo[fieldName] = TYPE_UNIQUE.check(fInfo!, jobState, options);

          const isIdentity =
            (typesInfo.Number || typesInfo.UUID || typesInfo.ObjectId) &&
            /^(gu|uu|_)?id/i.test(fieldName);

          if (isIdentity) fieldInfo[fieldName]!.identity = true;

          if (schema.uniques && schema.uniques[fieldName]) {
            fieldInfo[fieldName]!.uniqueCount = schema.uniques[
              fieldName
            ]!.length;
          }
          return fieldInfo;
        },
        {} as { [fieldName: string]: FieldInfo }
      );

      return {
        schemaName,
        fields,
        totalRows: schema.totalRows,
        nestedTypes: disableNestedTypes
          ? undefined
          : await nestedSchemaAnalyzer(nestedData),
      };
    });

  function nestedSchemaAnalyzer(nestedData) {
    return Object.entries(nestedData).reduce(
      async (nestedTypeSummaries, [fullTypeName, data]) => {
        const nameParts = fullTypeName.split(".");
        const nameSuffix = nameParts[nameParts.length - 1];

        nestedTypeSummaries[fullTypeName] = await schemaAnalyzer(
          nameSuffix!,
          data as any[],
          options
        );
        return nestedTypeSummaries;
      },
      {}
    );
  }
}

/**
 * @//returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
 */
const _pivotRowsGroupedByType = ({
  schemaName,
  isEnumEnabled,
  disableNestedTypes,
  nestedData,
  strictMatching,
  onProgress,
}) =>
  function pivotRowsGroupedByType(docs: any[]) {
    const detectedSchema = {
      uniques: isEnumEnabled ? {} : null,
      fieldsData: {},
      totalRows: null,
    };
    log(`  About to examine every row & cell. Found ${docs.length} records...`);
    const evaluateSchemaLevel = _evaluateSchemaLevel({
      schemaName,
      isEnumEnabled,
      disableNestedTypes,
      nestedData,
      strictMatching,
      onProgress,
    });
    const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
    log("  Extracted data points from Field Type analysis");
    return pivotedSchema;
  };

/**
 * internal
 * @private
 */
const _evaluateSchemaLevel = ({
  schemaName,
  isEnumEnabled,
  disableNestedTypes,
  nestedData,
  strictMatching,
  onProgress,
}) =>
  function evaluateSchemaLevel(
    schema: {
      totalRows: any;
      uniques: { [x: string]: any[] };
      fieldsData: { [x: string]: TypedFieldObject<FieldTypeSummary>[] };
    },
    row: { [x: string]: any },
    index: number,
    array: string | any[]
  ) {
    // eslint-disable-line
    schema.totalRows = schema.totalRows || array.length;
    const fieldNames = Object.keys(row);
    log(`Processing Row # ${index + 1}/${schema.totalRows}...`);
    fieldNames.forEach((fieldName, index, array) => {
      if (index === 0) log(`Found ${array.length} Column(s)!`);
      const value = row[fieldName];
      const typeFingerprint = getFieldMetadata({ value, strictMatching });
      const typeNames = Object.keys(typeFingerprint) as TypeNameString[];
      const isPossibleEnumOrUniqueType =
        typeNames.includes("Number") ||
        typeNames.includes("String") ||
        typeNames.includes("UUID") ||
        typeNames.includes("ObjectId");

      if (!disableNestedTypes) {
        // TODO: Review hackey pattern here (buffers too much, better association of custom types, see `$ref`)
        // Steps: 1. Check if Array of Objects, 2. Add to local `nestedData` to hold data for post-processing.
        if (
          Array.isArray(value) &&
          value.length >= 1 &&
          typeof value[0] === "object"
        ) {
          const keyPath = `${schemaName}.${fieldName}`;
          nestedData[keyPath] = nestedData[keyPath] || [];
          nestedData[keyPath].push(...value);
          typeFingerprint.$ref = typeFingerprint.$ref || {
            rank: -12,
            count: index,
          };
          typeFingerprint.$ref.typeAlias = keyPath;
        }
      }

      if (isEnumEnabled && isPossibleEnumOrUniqueType) {
        schema.uniques[fieldName] = schema.uniques[fieldName] || [];
        if (!schema.uniques[fieldName]!.includes(value))
          schema.uniques[fieldName]!.push(row[fieldName]);
        // } else {
        //   schema.uniques[fieldName] = null
      }
      schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || [];
      schema.fieldsData[fieldName]!.push(typeFingerprint);
    });

    const totalRows = schema.totalRows;
    const isDone = index + 1 === totalRows;
    const progressFrequencyModulo =
      totalRows >= 2500 ? 50 : totalRows >= 1000 ? 25 : 10;
    const showProgress = isDone || index % progressFrequencyModulo === 0;

    if (onProgress && showProgress) {
      // console.log("FIRE.onProgress:", totalRows, index + 1);
      // setImmediate(() => {
      onProgress({
        totalRows: totalRows,
        currentRow: index + 1,
        nestedTypes: nestedData && Object.keys(nestedData),
      });
      // });
    }
    return schema;
  };

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
function condenseFieldData(schema: {
  fieldsData: {
    [x: string]: TypedFieldObject<InternalFieldTypeData>[];
  };
  uniques: {
    [x: string]: any[];
  };
  totalRows: number;
}) {
  const { fieldsData } = schema;
  const fieldNames = Object.keys(fieldsData);

  const fieldSummary: { [key: string]: FieldInfo } = {};
  log(
    `Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`
  );
  fieldNames.forEach((fieldName) => {
    const pivotedData = pivotFieldDataByType(fieldsData[fieldName]!);
    fieldSummary[fieldName] = fieldSummary[fieldName] || { types: {} };
    fieldSummary[fieldName]!.types = condenseFieldSizes(pivotedData);
    if (pivotedData.$ref?.count ?? 0 > 1) {
      // Prevent overriding the $ref type label
      // 1. Find the first $ref
      const refType = fieldsData[fieldName]!.find((typeRefs) => typeRefs.$ref);
      // if (!fieldSummary[fieldName]?.types?.$ref) {
      //   throw new Error(`Invalid nested type $ref: fieldSummary[${fieldName}].types.$ref`)
      // }
      fieldSummary[fieldName]!.types.$ref!.typeAlias = refType!.$ref!.typeAlias;
    }

    // console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName])
  });
  log("Post-condenseFieldSizes(fields[fieldName])");
  log("Replaced fieldData with fieldSummary");
  return {
    fields: fieldSummary,
    uniques: schema.uniques || {},
    totalRows: schema.totalRows,
  };
}

interface IPivotData {
  typeName: string;
  length: number;
  scale: number;
  precision: number;
  value: number;
  count: number;
}

function pivotFieldDataByType(
  typeSizeData: TypedFieldObject<InternalFieldTypeData>[]
) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  log(`Processing ${typeSizeData.length} type guesses`);
  return typeSizeData.reduce((pivotedData, currentTypeGuesses) => {
    Object.entries(currentTypeGuesses).map(
      ([typeName, { value, length, scale, precision }]: [
        typeName: string,
        data: any
      ]) => {
        // console.log(typeName, JSON.stringify({ length, scale, precision }))
        pivotedData[typeName] = pivotedData[typeName] || { typeName, count: 0 };
        // if (!pivotedData[typeName].count) pivotedData[typeName].count = 0
        if (Number.isFinite(length) && !pivotedData[typeName].length)
          pivotedData[typeName].length = [];
        if (Number.isFinite(scale) && !pivotedData[typeName].scale)
          pivotedData[typeName].scale = [];
        if (Number.isFinite(precision) && !pivotedData[typeName].precision)
          pivotedData[typeName].precision = [];
        if (Number.isFinite(value) && !pivotedData[typeName].value)
          pivotedData[typeName].value = [];

        pivotedData[typeName].count++;
        // if (invalid != null) pivotedData[typeName].invalid++
        if (length) pivotedData[typeName].length.push(length);
        if (scale) pivotedData[typeName].scale.push(scale);
        if (precision) pivotedData[typeName].precision.push(precision);
        if (value) pivotedData[typeName].value.push(value);
        // pivotedData[typeName].rank = typeRankings[typeName]
        return pivotedData[typeName];
      }
    );
    return pivotedData;
  }, {} as TypedFieldObject<InternalFieldTypeData>);
  /*
  > Example of sumCounts at this point
  {
    Float: { count: 4, scale: [ 5, 5, 5, 5 ], precision: [ 2, 2, 2, 2 ] },
    String: { count: 3, length: [ 2, 3, 6 ] },
    Number: { count: 1, length: [ 6 ] }
  }
*/
}

/**
 * Internal function which analyzes and summarizes each columns data by type. Sort of a histogram of significant points.
 */
function condenseFieldSizes(
  pivotedDataByType: { [k in TypeNameString]?: InternalFieldTypeData }
) {
  const aggregateSummary: { [k in TypeNameString]?: FieldTypeSummary } = {};
  log("Starting condenseFieldSizes()");
  Object.keys(pivotedDataByType).map(
    (typeName: string, idx: number, arr: any[]) => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName] || -42,
        count: pivotedDataByType[typeName]!.count,
      };

      if (typeName === "$ref" && aggregateSummary[typeName]) {
        // console.log(
        //   "pivotedDataByType.$ref",
        //   JSON.stringify(pivotedDataByType.$ref, null, 2)
        // );
        aggregateSummary[
          typeName
        ]!.typeAlias = pivotedDataByType.$ref!.typeAlias;
      } else {
        if (pivotedDataByType[typeName]!.value)
          aggregateSummary[typeName]!.value = getNumberRangeStats(
            pivotedDataByType[typeName].value
          );
        if (pivotedDataByType[typeName]!.length)
          aggregateSummary[typeName]!.length = getNumberRangeStats(
            pivotedDataByType[typeName].length,
            true
          );
        if (pivotedDataByType[typeName]!.scale)
          aggregateSummary[typeName]!.scale = getNumberRangeStats(
            pivotedDataByType[typeName].scale,
            true
          );
        if (pivotedDataByType[typeName]!.precision)
          aggregateSummary[typeName]!.precision = getNumberRangeStats(
            pivotedDataByType[typeName].precision,
            true
          );
      }
      if (
        aggregateSummary[typeName] &&
        ["Timestamp", "Date"].indexOf(typeName) > -1
      ) {
        aggregateSummary[typeName].value! = formatRangeStats(
          <any>aggregateSummary[typeName]!.value!,
          parseDate
        );
      }
    }
  );
  log("Done condenseFieldSizes()...");
  return aggregateSummary;
}

function getFieldMetadata({
  value,
  strictMatching,
}: {
  value: any;
  strictMatching: boolean;
}) {
  // Get initial pass at the data with the TYPE_* `.check()` methods.
  const typeGuesses = detectTypes(value, strictMatching);

  // Assign initial metadata for each matched type below
  return typeGuesses.reduce(
    (analysis: TypedFieldObject<FieldTypeSummary>, typeGuess, index) => {
      let length;
      let precision;
      let scale;
      let rank = index + 1;
      let count = 1;

      analysis[typeGuess] = { rank, count };

      if (typeGuess === "Array") {
        length = value.length;
        analysis[typeGuess] = { ...analysis[typeGuess], rank, count, length };
      }
      if (typeGuess === "Float") {
        value = parseFloat(String(value));
        analysis[typeGuess] = { ...analysis[typeGuess], rank, count, value };
        const significandAndMantissa = String(value).split(".");
        if (significandAndMantissa.length === 2) {
          precision = significandAndMantissa.join("").length; // total # of numeric positions before & after decimal
          scale = significandAndMantissa[1]!.length;
          analysis[typeGuess] = {
            ...analysis[typeGuess],
            rank,
            count,
            precision,
            scale,
          };
        }
      }
      if (typeGuess === "Number") {
        value = Number(value);
        analysis[typeGuess] = { ...analysis[typeGuess], rank, count, value };
      }
      if (typeGuess === "Date" || typeGuess === "Timestamp") {
        const checkedDate = isValidDate(value);
        if (checkedDate) {
          analysis[typeGuess] = {
            ...analysis[typeGuess],
            rank,
            count,
            value: checkedDate.getTime(),
          };
          // } else {
          //   analysis[typeGuess] = { ...analysis[typeGuess], invalid: true, value: value }
        }
      }
      if (typeGuess === "String" || typeGuess === "Email") {
        length = String(value).length;
        analysis[typeGuess] = { ...analysis[typeGuess], rank, count, length };
      }
      return analysis;
    },
    {}
  );
}

/**
 * Accepts an array of numbers and returns summary data about
 *  the range & spread of points in the set.
 *
 * @param {number[]} numbers - sequence of unsorted data points
 */
function getNumberRangeStats(
  numbers?: number[],
  useSortedDataForPercentiles = false
) {
  if (!numbers || numbers.length < 1) return undefined;
  const sortedNumbers = numbers
    .slice()
    .sort((a, b) => (a < b ? -1 : a === b ? 0 : 1));
  const sum = numbers.reduce((a, b) => a + b, 0);
  if (useSortedDataForPercentiles) numbers = sortedNumbers;
  return {
    // size: numbers.length,
    min: sortedNumbers[0],
    mean: sum / numbers.length,
    max: sortedNumbers[numbers.length - 1],
    p25: numbers[parseInt(String(numbers.length * 0.25), 10)],
    p33: numbers[parseInt(String(numbers.length * 0.33), 10)],
    p50: numbers[parseInt(String(numbers.length * 0.5), 10)],
    p66: numbers[parseInt(String(numbers.length * 0.66), 10)],
    p75: numbers[parseInt(String(numbers.length * 0.75), 10)],
    p99: numbers[parseInt(String(numbers.length * 0.99), 10)],
  };
}

/**
 *
 */
function formatRangeStats<T, TFormatReturn>(
  stats: AggregateSummary<T>,
  formatter: (n?: T) => TFormatReturn
) {
  return {
    // size: stats.size,
    min: formatter(stats.min),
    mean: formatter(stats.mean),
    max: formatter(stats.max),
    p25: formatter(stats.p25),
    p33: formatter(stats.p33),
    p50: formatter(stats.p50),
    p66: formatter(stats.p66),
    p75: formatter(stats.p75),
    p99: formatter(stats.p99),
  };
}

export {
  // evaluateSchemaLevel as _evaluateSchemaLevel,
  schemaAnalyzer,
  condenseFieldData as _condenseFieldData,
  pivotFieldDataByType as _pivotFieldDataByType,
  getNumberRangeStats as _getNumberRangeStats,
  formatRangeStats as _formatRangeStats,
  getFieldMetadata as _getFieldMetadata,
  isValidDate as _isValidDate,
};
