import { isObject } from "../shared/index";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

// 表层只读
// 内层就不管了
export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

// 是否是响应式对象
export function isReactive(value) {
  // 触发getter即可
  // 如果不是reactive对象，则默认没有 ‘IS_REACTIVE’
  return !!value[ReactiveFlags.IS_REACTIVE];
}

// 是否是只读
export function isReadonly(value) {
  // 触发getter即可
  // 如果不是reactive对象，则默认没有 ‘IS_READONLY’
  return !!value[ReactiveFlags.IS_READONLY];
}

// 判断是否是通过 reactive 或者 readonly 创建的
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createActiveObject(target, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  return new Proxy(target, baseHandlers);
}
