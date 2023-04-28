import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { isObject } from "../shared/index";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceHanlders } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

let currentInstance = null;

export function createComponentInstance(vnode: any, parent: any) {
  // type即当前的组件标签类型
  // 格式为（举例）：
  //   ```{
  //     render() {
  //         return h("div", "hello" + this.msg)
  //     },
  //     setup() {
  //         return {
  //             msg: 123
  //         }
  //     }
  //   }
  //   ```
  const componet = {
    vnode,
    isMounted: false,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    subTree: {},
    next: null,
  };

  componet.emit = emit.bind(null, componet) as any;

  return componet;
}

export function setupComponent(instance: any) {
  // initProps
  initProps(instance, shallowReadonly(instance.vnode.props));
  // initSlots
  initSlots(instance, instance.vnode.children);

  // 初始化为有状态的组件
  setupStatefulComponent(instance);
}

// 初始化为有状态的组件
function setupStatefulComponent(instance: any) {
  // 当前组件
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceHanlders);

  // 获取setup的返回值
  const { setup } = Component;

  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, {
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

// 处理setup的返回值
// setup返回值可以是对象，也可以是函数
// 如果返回的是函数，则当作是render
function handleSetupResult(instance: any, setupResult: any) {
  // 为对象
  if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
  // 为函数
}

//
function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
