import { ShapeFlags } from "../shared/ShapeFlags";
import { isArray, isObject, isString } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

// 渲染器
export function render(vnode: any, container: any) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  // !! 先判断vnode 的类型
  // 再进行处理
  // vue3是通过 位 运算符去区分类型的
  const { shapeFlag } = vnode;

  if (shapeFlag & ShapeFlags.ELEMENT) {
    // 元素类型 typeof vnode.type === "string"
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENTS) {
    // 处理组件类型 isObject(vnode.type)
    processComponent(vnode, container);
  }
}

// 处理普通 元素
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 挂载普通元素
function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));

  const { children, props, shapeFlag } = vnode;

  // 需要判断children是数组还是字符串
  // 通过位运算符 &
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // isString(children)
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // isArray(children)
    mountChildren(children, el);
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
function mountComponent(initialVNode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(initialVNode);

  // 处理setup
  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance;
  // 得到一个ast树,实际上就是一个描述虚拟节点的对象
  const subTree = instance.render.call(proxy);

  // 进行组件挂载
  patch(subTree, container);
  // 挂载完成后，将`mountElement`绑定的el取出
  initialVNode.el = subTree.el;
}
