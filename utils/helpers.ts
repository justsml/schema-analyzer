import { mapValues } from "lodash-es";
import {
  AggregateSummary,
  FieldInfo,
  SimpleFieldInfo,
  TypeNameString,
  TypeSummary,
} from "..";

interface IHelperOptions {
  targetLength: keyof AggregateSummary;
  targetScale: keyof AggregateSummary;
  targetPrecision: keyof AggregateSummary;

}

export function flattenTypes(
  results: TypeSummary<FieldInfo>,
  options: IHelperOptions
): TypeSummary<SimpleFieldInfo> {
  const fields: { [key: string]: SimpleFieldInfo } = {};

  Object.entries(results.fields).map(([fieldName, fieldInfo]) => {
    if (results.nestedTypes && fieldInfo.types.$ref) {
      const { typeAlias } = fieldInfo.types?.$ref;
      // lookup real count, set it on the $ref
      const { totalRows } = results.nestedTypes[typeAlias!]!;
      fieldInfo.types.$ref.count = totalRows;
    }
    fields[fieldName] = _simplifyFieldInfo(fieldInfo);
  });

  return {
    schemaName: results.schemaName,
    fields,
    nestedTypes: results.nestedTypes
      ? mapValues(results.nestedTypes, flattenTypes)
      : undefined,
    totalRows: results.totalRows,
  };
}

function _simplifyFieldInfo(fieldInfo: FieldInfo): SimpleFieldInfo {
  let arrayOfTypes = Object.entries(fieldInfo.types); //as [n: TypeNameString, summary?: FieldTypeSummary][]
  arrayOfTypes = arrayOfTypes
    .slice(0)
    .filter((f) => f[0] !== "Null" && f[0] !== "Unknown")
    .sort((a, b) =>
      a[1]!.count > b[1]!.count ? -1 : a[1]!.count === b[1]!.count ? 0 : 1
    );

  let topType =
    arrayOfTypes.length > 0 ? arrayOfTypes[0]![0] : ("Null" as TypeNameString);
  let typeRef: string | undefined = undefined;

  // check for undercounted $ref due to empty arrays in the rows
  if (topType === "Array" && arrayOfTypes[1]?.[0] === "$ref") {
    typeRef = arrayOfTypes[1]?.[1]?.typeAlias;
  }

  if (topType === "$ref") {
    console.error(`arrayOfTypes`, arrayOfTypes);
    // console.error(`arrayOfTypes[1]`, arrayOfTypes[1]);
    typeRef = arrayOfTypes[0]?.[1]?.typeAlias;
  }
  return {
    identity: fieldInfo.identity,
    type: topType as TypeNameString,
    typeRef,
    enum: fieldInfo.enum || null,
    nullable: fieldInfo.nullable || false,
    unique: fieldInfo.unique || false,
  };
}
