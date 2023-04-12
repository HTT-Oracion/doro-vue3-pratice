import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;
  // 渲染器
  function render(vnode: any, container: any, parentComponent) {
    patch(vnode, container, parentComponent);
  }

  function patch(vnode: any, container: any, parentComponent) {
    // !! 先判断vnode 的类型
    // 再进行处理
    // vue3是通过 位 运算符去区分类型的
    const { type, shapeFlag } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素类型 typeof vnode.type === "string"
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENTS) {
          // 处理组件类型 isObject(vnode.type)
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  // 处理text node
  // children是传过来的文本内容
  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  // 处理Fragment
  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
  }

  // 处理普通 元素
  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }

  // 挂载普通元素
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    // 需要判断children是数组还是字符串
    // 通过位运算符 &
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // isString(children)
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // isArray(children)
      mountChildren(children, el, parentComponent);
    }
    for (const key in props) {
      const val = props[key];
      patchProp(el, key, val);
    }

    insert(el, container);
  }

  // 挂载子节点
  function mountChildren(children: any, container: any, parentComponent) {
    children.forEach((node) => {
      patch(node, container, parentComponent);
    });
  }

  // 处理组件
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }

  // 挂在组件
  function mountComponent(initialVNode: any, container: any, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    // 处理setup
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    const { proxy } = instance;
    // 得到一个ast树,实际上就是一个描述虚拟节点的对象
    const subTree = instance.render.call(proxy);

    // 进行组件挂载
    patch(subTree, container, instance);
    // 挂载完成后，将`mountElement`绑定的el取出
    initialVNode.el = subTree.el;
  }
  return {
    createApp: createAppAPI(render),
  };
}
