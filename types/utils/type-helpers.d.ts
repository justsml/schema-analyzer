/**
 * Type Rank Map: Use to sort Lowest to Highest
 */
export const typeRankings: {
    [x: string]: number;
};
export const prioritizedTypes: ({
    /**
     * @param {string} value
     */
    check: (value: string) => boolean;
    type: string;
} | {
    check: typeof isObjectId;
    type: string;
    supercedes: string[];
})[];
/**
 * Returns an array of TypeName.
 * @param {any} value - input data
 * @returns {string[]}
 */
export function detectTypes(value: any, strictMatching?: boolean): string[];
export namespace MetaChecks {
    namespace TYPE_ENUM {
        const type: string;
        const matchBasicTypes: string[];
        function check(typeInfo: any, { rowCount, uniques }: {
            rowCount: any;
            uniques: any;
        }, { enumAbsoluteLimit, enumPercentThreshold }: {
            enumAbsoluteLimit: any;
            enumPercentThreshold: any;
        }): any;
    }
    namespace TYPE_NULLABLE {
        const type_1: string;
        export { type_1 as type };
        export function check_1(typeInfo: any, { rowCount, uniques }: {
            rowCount: any;
            uniques: any;
        }, { nullableRowsThreshold }: {
            nullableRowsThreshold: any;
        }): any;
        export { check_1 as check };
    }
    namespace TYPE_UNIQUE {
        const type_2: string;
        export { type_2 as type };
        export function check_2(typeInfo: {
            Array?: import("..").FieldTypeStats;
            Boolean?: import("..").FieldTypeStats;
            Currency?: import("..").FieldTypeStats;
            Date?: import("..").FieldTypeStats;
            Email?: import("..").FieldTypeStats;
            Float?: import("..").FieldTypeStats;
            Null?: import("..").FieldTypeStats;
            Number?: import("..").FieldTypeStats;
            Object?: import("..").FieldTypeStats;
            ObjectId?: import("..").FieldTypeStats;
            String?: import("..").FieldTypeStats;
            Timestamp?: import("..").FieldTypeStats;
            Unknown?: import("..").FieldTypeStats;
            UUID?: import("..").FieldTypeStats;
        }, { rowCount, uniques }: {
            rowCount: any;
            uniques: any;
        }, { uniqueRowsThreshold }: {
            uniqueRowsThreshold: any;
        }): {
            Array?: import("..").FieldTypeStats;
            Boolean?: import("..").FieldTypeStats;
            Currency?: import("..").FieldTypeStats;
            Date?: import("..").FieldTypeStats;
            Email?: import("..").FieldTypeStats;
            Float?: import("..").FieldTypeStats;
            Null?: import("..").FieldTypeStats;
            Number?: import("..").FieldTypeStats;
            Object?: import("..").FieldTypeStats;
            ObjectId?: import("..").FieldTypeStats;
            String?: import("..").FieldTypeStats;
            Timestamp?: import("..").FieldTypeStats;
            Unknown?: import("..").FieldTypeStats;
            UUID?: import("..").FieldTypeStats;
        } | {
            Array?: import("..").FieldTypeStats;
            Boolean?: import("..").FieldTypeStats;
            Currency?: import("..").FieldTypeStats;
            Date?: import("..").FieldTypeStats;
            Email?: import("..").FieldTypeStats;
            Float?: import("..").FieldTypeStats;
            Null?: import("..").FieldTypeStats;
            Number?: import("..").FieldTypeStats;
            Object?: import("..").FieldTypeStats;
            ObjectId?: import("..").FieldTypeStats;
            String?: import("..").FieldTypeStats;
            Timestamp?: import("..").FieldTypeStats;
            Unknown?: import("..").FieldTypeStats;
            UUID?: import("..").FieldTypeStats;
            unique: boolean;
        };
        export { check_2 as check };
    }
}
export namespace TYPE_UNKNOWN {
    export function check_3(value: string): boolean;
    export { check_3 as check };
    const type_3: string;
    export { type_3 as type };
}
export namespace TYPE_OBJECT_ID {
    export { isObjectId as check };
    const type_4: string;
    export { type_4 as type };
    export const supercedes: string[];
}
export namespace TYPE_UUID {
    export { isUuid as check };
    const type_5: string;
    export { type_5 as type };
    const supercedes_1: string[];
    export { supercedes_1 as supercedes };
}
export namespace TYPE_BOOLEAN {
    export { isBoolish as check };
    const type_6: string;
    export { type_6 as type };
    const supercedes_2: string[];
    export { supercedes_2 as supercedes };
}
export namespace TYPE_DATE {
    export { isDateString as check };
    const type_7: string;
    export { type_7 as type };
    const supercedes_3: string[];
    export { supercedes_3 as supercedes };
}
export namespace TYPE_TIMESTAMP {
    export { isTimestamp as check };
    const supercedes_4: string[];
    export { supercedes_4 as supercedes };
    const type_8: string;
    export { type_8 as type };
}
export namespace TYPE_CURRENCY {
    export { isCurrency as check };
    const type_9: string;
    export { type_9 as type };
    const supercedes_5: string[];
    export { supercedes_5 as supercedes };
}
export namespace TYPE_FLOAT {
    export { isFloatish as check };
    const type_10: string;
    export { type_10 as type };
    const supercedes_6: string[];
    export { supercedes_6 as supercedes };
}
export namespace TYPE_NUMBER {
    export function check_4(value: any): boolean;
    export { check_4 as check };
    const type_11: string;
    export { type_11 as type };
}
export namespace TYPE_NULL {
    const type_12: string;
    export { type_12 as type };
    export { isNullish as check };
}
export namespace TYPE_EMAIL {
    export { isEmailShaped as check };
    const type_13: string;
    export { type_13 as type };
    const supercedes_7: string[];
    export { supercedes_7 as supercedes };
}
export namespace TYPE_STRING {
    const type_14: string;
    export { type_14 as type };
    export function check_5(value: any): boolean;
    export { check_5 as check };
}
export namespace TYPE_ARRAY {
    export function check_6(value: any): boolean;
    export { check_6 as check };
    const type_15: string;
    export { type_15 as type };
}
export namespace TYPE_OBJECT {
    export function check_7(value: any): boolean;
    export { check_7 as check };
    const type_16: string;
    export { type_16 as type };
}
import { isObjectId } from "./type-detectors";
import { isUuid } from "./type-detectors";
import { isBoolish } from "./type-detectors";
import { isDateString } from "./type-detectors";
import { isTimestamp } from "./type-detectors";
import { isCurrency } from "./type-detectors";
import { isFloatish } from "./type-detectors";
import { isNullish } from "./type-detectors";
import { isEmailShaped } from "./type-detectors";
