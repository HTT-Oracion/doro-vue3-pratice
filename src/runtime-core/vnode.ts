import { ShapeFlags } from "../shared/shapeFlags";
import { isArray } from "../shared/index";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props: props ?? {},
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
    key: props && props.key,
    component: null,
  };

  if (typeof children === "string") {
    // type为string(如div)  0001 | 0100 => 0100
    // type为array(组件)  0010 | 0100 => 0100
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    // type为string(如div) 0001 | 1000 => 1000
    // type为array(组件) 0010 | 1000 => 1000
  } else if (isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // slots?
  // 虚拟节点为组件类型 且 children为object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENTS) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

export function createTextVNode(text) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENTS;
}
