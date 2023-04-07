import { isObject } from "../shared/index";

export function createComponentInstance(vnode: any) {
  // type即当前的组件
  // 不知道为什么vue3里要写成type..，不太好理解
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
    type: vnode.type,
  };
  return componet;
}

export function setupComponent(instance: any) {
  // initProps

  // initSlots

  // 初始化为有状态的组件
  setupStatefulComponent(instance);
}

// 初始化为有状态的组件
function setupStatefulComponent(instance: any) {
  // 当前组件
  const Component = instance.type;

  // 获取setup的返回值
  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

// 处理setup的返回值
// setup返回值可以是对象，也可以是函数
// 如果返回的是函数，则当作是render
function handleSetupResult(instance: any, setupResult: any) {
  // 为对象
  if (isObject(setupResult)) {
    instance.setupState = setupResult;
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
