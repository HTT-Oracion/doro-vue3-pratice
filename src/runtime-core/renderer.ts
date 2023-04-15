import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  // 渲染器
  function render(vnode: any, container: any, parentComponent) {
    patch(null, vnode, container, parentComponent);
  }

  // n1：旧
  // n2: 新
  // 有n1时为更新操作
  function patch(n1, n2, container: any, parentComponent) {
    // !! 先判断vnode 的类型
    // 再进行处理
    // vue3是通过 位 运算符去区分类型的
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素类型 typeof vnode.type === "string"
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENTS) {
          // 处理组件类型 isObject(vnode.type)
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  // 处理text node
  // children是传过来的文本内容
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  // 处理Fragment
  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  // 处理普通 元素
  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  // 挂载普通元素
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
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
      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container);
  }

  // 更新普通元素
  function patchElement(n1: any, n2: any, container: any, parentComponent) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
  }

  // 更新节点内容 (children)
  // 4种情况需要处理
  // array => array,.array => text
  // text => array, text => text
  function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    const c1 = n1.children;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // Array => text
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 把旧的children清空
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        // 设置text
        hostSetElementText(container, c2);
      }
    } else {
      // array => text
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent);
      } else {
        // array => array
        console.log("array to array");
      }
    }
  }

  // 删除children
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  // 更新props
  function patchProps(el, oldProps, newProps) {
    console.log("patchProps");
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        console.log(prevProp, nextProp);

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  // 挂载子节点
  function mountChildren(children: any, container: any, parentComponent) {
    console.log("mountChildren", children);

    children.forEach((node) => {
      patch(null, node, container, parentComponent);
    });
  }

  // 处理组件
  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
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
    effect(() => {
      // 只有 !isMounted时才进行节点挂载, isMounted时应该是更新操作
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 得到一个ast树,实际上就是一个描述虚拟节点的对象
        // 保存subTree,更新的时候就可以拿到它作为旧的ast树
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 进行组件挂载
        patch(null, subTree, container, instance);
        // 挂载完成后，将`mountElement`绑定的el取出
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}
