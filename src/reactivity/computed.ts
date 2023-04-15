import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _dirty: boolean = true; // !! // 用于做缓存处理，重复调用.value时, 不重复进行计算
  private _value: any;
  private _effect: ReactiveEffect;
  constructor(getter) {
    // 初始化的时候，进行依赖收集，schduler用来改变`_dirty`
    // 当传入的getter发生改变的时候，会触发 `trigger`
    // 此时就需要把 `_dirty` 变为true
    // 这样确保getter更改后，重新获取.value时，可以重新进行计算得到最新的值
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // 重新获取.value时，直接返回保存过的值，不触发getter
    if (this._dirty) {
      // 缓存处理
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
