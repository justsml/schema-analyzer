/**
 * @param {string | any[]} value
 */
export function isBoolish(value: string | any[], _fieldName?: any): boolean;
/**
 * @param {string} value
 */
export function isCurrency(value: string): boolean;
/**
 * @param {string | any[]} value
 */
export function isDateString(value: string | any[], _fieldName?: any): boolean;
/**
 * @param {string | string[]} value
 */
export function isEmailShaped(value: string | string[]): boolean;
/**
 * @param {unknown} value
 */
export function isFloatish(value: unknown): boolean;
/**
 * @param {any} value
 */
export function isNullish(value: any): boolean;
/**
 * @param {string | any[]} [value] - raw input to validate
 */
export function isNumeric(value?: string | any[], _fieldName?: any): boolean;
/**
 * @param {string | any[]=} value
 */
export function isObjectId(value?: (string | any[]) | undefined, _fieldName?: any): boolean;
/**
 * @param {string} value
 */
export function isTimestamp(value: string): boolean;
/**
 * @param {string | any[]} value
 */
export function isUuid(value: string | any[], _fieldName?: any): boolean;
