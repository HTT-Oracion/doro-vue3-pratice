import { hasChanged, isObject } from "../shared";
import { shallowUnrefHandlers } from "./baseHandlers";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { isReactive, reactive } from "./reactive";

const IS_REF = "__v_isRef";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep: any;
  public readonly [IS_REF] = true;
  constructor(value) {
    // 如果传入的是对象，则把它转换为 reactive
    // 并且保存原始值
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref[IS_REF];
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  // 取值的时候 如果是ref， 返回.value
  // 否则原值返回
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnrefHandlers);
}
