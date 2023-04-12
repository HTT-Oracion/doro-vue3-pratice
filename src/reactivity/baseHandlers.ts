import { extend, isObject } from "../shared/index";
import { track, trigger } from "./effect";
import { ReactiveFlags, reactive, readonly } from "./reactive";
import { isRef, unRef } from "./ref";

// 提取出来的目的是，初始化的时候就生成一个getter/setter
// 而不是每次调用mutableHandlers的时候再去生成
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

// proxy hanlder
// 不可变的
export const mutableHandlers = {
  get,
  set,
};
export const baseHandlers = mutableHandlers;

// readonly的
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key: ${key} 是 readonly ，无法触发 set`, target);
    return true;
  },
};

// 表层readonly
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});

// proxyRefs hanlder
export const shallowUnrefHandlers = {
  get(target, key) {
    return unRef(Reflect.get(target, key));
  },
  set(target, key, value) {
    const oldValue = target[key];
    // 分几种情况
    if (isRef(Reflect.get(target, key)) && !isRef(value)) {
      // 1.原值是ref, 新值不是ref，则更新.value
      oldValue.value = value;
      return true;
    } else {
      // 2.其他情况：新值是ref，则直接替换
      return Reflect.set(target, key, value);
    }
  },
};

// proxy getter:
// 按照vue3的方式封装成一个高阶函数，根据是否是 readonly去判断是否要收集依赖
function createGetter(isReadonly = false, shallow = false) {
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

    // 如果是shallow，则不需要对它的子属性进行响应式
    // 因为shallow的话，只有最外层是进行处理的
    if (shallow) return res;

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
