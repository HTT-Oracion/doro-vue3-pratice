import { effect } from "../reactivity/effect";
import { EMPTY_ARR, EMPTY_OBJ } from "../shared";
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
    patch(null, vnode, container, parentComponent, null);
  }

  // n1：旧
  // n2: 新
  // 有n1时为更新操作
  function patch(n1, n2, container: any, parentComponent, anchor) {
    // !! 先判断vnode 的类型
    // 再进行处理
    // vue3是通过 位 运算符去区分类型的
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素类型 typeof vnode.type === "string"
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENTS) {
          // 处理组件类型 isObject(vnode.type)
          processComponent(n1, n2, container, parentComponent, anchor);
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
  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  // 处理普通 元素
  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, parentComponent, anchor);
    }
  }

  // 挂载普通元素
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    // 需要判断children是数组还是字符串
    // 通过位运算符 &
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // isString(children)
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // isArray(children)
      mountChildren(children, el, parentComponent, anchor);
    }
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container, anchor);
  }

  // 更新普通元素
  function patchElement(n1: any, n2: any, parentComponent, anchor) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);
    console.log("patchElement", n1, n2);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  // 更新节点内容 (children)
  // 4种情况需要处理
  // array => array,.array => text
  // text => array, text => text
  function patchChildren(n1, n2, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array => array

        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
        console.log("array to array");
      }
    }
  }

  // 跟新array to array的children
  // diff算法
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    let l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSameVNode(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 1.左侧比较
    // (ab) => (ab)c
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 2.右侧比较
    // (ab) => c(ab)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 3.新的比旧的多，创建
    // (ab) => (ab)c OR
    // (ab) => c(ab)
    if (i > e1) {
      console.log("i > e1 ");
      if (i <= e2) {
        // 获取锚点，用于插入节点.
        // @see `runtime-dom/index/#insert()`
        const nextPos = e2 + 1;

        const anchor = e2 + 1 < l2 ? c2[nextPos].el : null;
        console.log(i, e2, anchor);
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    }
    // 4.新的旧的少，删除
    // (ab)c => (ab) OR
    // c(ab) => (ab)
    else if (i > e2) {
      console.log("i > e2");
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }
    // 乱序部分
    // diff算法核心.
    else {
      // 5.1 中间部分比对
      // c1:[a,b (c,d,e) f,g]
      // c2:[a,b (d,c) f,g]
      // e1: 4, e2: 3, i: 2
      let s1 = i; // 旧的children开始的索引
      let s2 = i; // 新的children开始的索引

      // key => index
      // 用于收集 key 跟 当前 i的映射关系
      const keyToNewIndexMap = new Map();
      // 遍历新的节点里的 ab
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        // 设置了key的话，收集起来
        if (nextChild.key !== null && !keyToNewIndexMap.has(nextChild.key)) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }

      let patched = 0; // 以处理的新节点的数量
      const toBePatched = e2 - s2 + 1; // 新节点的数量
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 已处理的数量 >= 需要对比的数量，则旧children后的节点直接删除即可
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        // 在旧节点在新[children]里的索引
        let newIndex;
        // 只有设置了key时才会用key去做对比
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= s2; j++) {
            if (isSameVNode(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 不存在则删除
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 新的节点索引如果 < 记录的最大索引，则说明需要移动
          // 比如 (大概可能也许是这样)
          // 原本children [a,b,c,d,e,f]
          // 新children [a,b,e,c,d,f]
          // [c:0,d:1,e:2] => [e:0,c:1,d:2]
          // 此时 新的e 为 0 < c:1，说明移动了
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // !!为0 表示该节点在旧的children里不存在 需要创建
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 5.2最长递增子序列
      const increasingNewIndexSquence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR;
      let j = increasingNewIndexSquence.length - 1;
      // 倒叙比对更新
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 新的索引
        const nextIndex = i + s2;
        // 新的节点
        const nextChild = c2[nextIndex];
        // 锚点
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSquence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
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
  function mountChildren(
    children: any,
    container: any,
    parentComponent,
    anchor
  ) {
    console.log("mountChildren", children);

    children.forEach((node) => {
      patch(null, node, container, parentComponent, anchor);
    });
  }

  // 处理组件
  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  // 挂在组件
  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    // 处理setup
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(
    instance: any,
    initialVNode: any,
    container: any,
    anchor
  ) {
    effect(() => {
      // 只有 !isMounted时才进行节点挂载, isMounted时应该是更新操作
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 得到一个ast树,实际上就是一个描述虚拟节点的对象
        // 保存subTree,更新的时候就可以拿到它作为旧的ast树
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 进行组件挂载
        patch(null, subTree, container, instance, anchor);
        // 挂载完成后，将`mountElement`绑定的el取出
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}

function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
