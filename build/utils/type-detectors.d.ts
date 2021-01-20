export { isBoolish, isCurrency, isDateString, isEmailShaped, isFloatish, isNullish, isNumeric, isObjectId, isTimestamp, isUuid, };
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
declare function isBoolish(value: string | any[] | null, fieldName?: string): boolean;
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
declare function isUuid(value: string | any[] | null, fieldName?: string): boolean;
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
declare function isObjectId(value: string | any[] | null, fieldName?: string): boolean;
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
declare function isDateString(value: string | any[] | null, fieldName?: string): boolean;
/**
 * @param {string | null} value
 */
declare function isTimestamp(value: string | null): boolean;
/**
 * @param {string | null} value
 */
declare function isCurrency(value: string | null): boolean;
/**
 * @param {string | any[]} value
 * @param {undefined} [fieldName]
 */
declare function isNumeric(value: string | any[], fieldName?: string | undefined): boolean;
/**
 * @param {unknown} value
 */
declare function isFloatish(value: unknown): boolean;
/**
 * @param {string | string[] | null} value
 */
declare function isEmailShaped(value: string | string[] | null): boolean;
/**
 * @param {null} value
 */
declare function isNullish(value: any): boolean;
