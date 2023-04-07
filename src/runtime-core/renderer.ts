import { isArray, isObject, isString } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

// 渲染器
export function render(vnode: any, container: any) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  console.log(vnode);

  // !! 先判断vnode 的类型
  // 再进行处理
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    // 处理组件类型
    processComponent(vnode, container);
  }
}

// 处理普通 元素
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 挂载普通元素
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);

  const { children, props } = vnode;

  // 需要判断children是数组还是字符串

  if (isArray(children)) {
    mountChildren(children, el);
  } else if (isString(children)) {
    el.textContent = children;
  }

  for (const key in props) {
    el.setAttribute(key, props[key]);
  }

  container.append(el);
}

// 挂载子节点
function mountChildren(vnode: any, container: any) {
  vnode.forEach((node) => {
    patch(node, container);
  });
}

// 处理组件
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

// 挂在组件
function mountComponent(vnode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(vnode);

  // 处理setup
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container: any) {
  // 得到一个ast树,实际上就是一个描述虚拟节点的对象
  const subTree = instance.render();

  // 进行组件挂载
  patch(subTree, container);
}
