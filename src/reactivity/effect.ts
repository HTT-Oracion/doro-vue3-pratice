import { extend } from "../shared";
// 当前触发effect的实例
let activeEffect;
// 是否要收集依赖
let shouldTrack;
class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true; // 区分是否调用了`stop`. （false则为调用了`stop`）
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 如果点击了stop
    // 执行并直接返回传入的函数 不进行依赖收集
    if (!this.active) {
      return this._fn();
    }

    // 先打开track开关 再重置
    shouldTrack = true;
    activeEffect = this;

    /**
     * 执行传入的函数
     * 如 obj.prop ++
     * 此时会触发 getter(track)再触发 setter(trigger)
     * @see{track}
     * @see{trigger}
     */
    const result = this._fn();
    // 待函数执行完毕 关闭track开关.
    shouldTrack = false;
    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  // 移除依赖
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });

  // 清空deps
  effect.deps.length = 0;
}

const targetMap = new Map();

// 收集依赖 （如getter）
export function track(target, key) {
  if (!isTracking()) return;
  // reactive是根据 target => key 去收集依赖的
  // ref不需要，因为ref只有.value
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);

  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  // 如果已经收集过依赖了
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

// 是否是正在跟踪（收集依赖）
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

// 触发依赖 (如 setter)
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop;

  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
