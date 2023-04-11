export const extend = Object.assign;

export const isString = (val) => typeof val === "string";
export const isObject = (val) => val !== null && typeof val === "object";
export const isArray = (val) => Array.isArray(val);
export const hasChanged = (val, newVal) => !Object.is(val, newVal);
export const hasOwn = (val: any, key: string | symbol) =>
  Object.prototype.hasOwnProperty.call(val, key);

const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const toHandlerKey = (str: string) => {
  return str ? `on${capitalize(str)}` : "";
};
