export const extend = Object.assign;

export const isString = (val) => typeof val === "string";
export const isObject = (val) => val !== null && typeof val === "object";
export const isArray = (val) => Array.isArray(val);
export const hasChanged = (val, newVal) => !Object.is(val, newVal);
