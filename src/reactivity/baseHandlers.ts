import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { ReactiveFlags, reactive, readonly } from "./reactive";

// 提取出来的目的是，初始化的时候就生成一个getter/setter
// 而不是每次调用mutableHandlers的时候再去生成
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// proxy hanlder
// 不可变的
export const mutableHandlers = {
  get,
  set,
};

// readonly的
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key: ${key} 是 readonly ，无法触发 set`, target);
    return true;
  },
};

// proxy getter:
// 按照vue3的方式封装成一个高阶函数，根据是否是 readonly去判断是否要收集依赖
function createGetter(isReadonly = false) {
  return function get(target, key) {
    // 调用的 isReactive
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    // 调用isReadonly
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    // 当前值是否为对象
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      // 依赖收集
      track(target, key);
    }
    return res;
  };
}

// proxy setter
// 保持代码结构一致性 、
function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    // 触发依赖
    trigger(target, key);
    return res;
  };
}
