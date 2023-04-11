import { isFunction } from "../../shared/index";
import { createVNode } from "../vnode";

/**
 * 返回对应插槽的虚拟节点
 * @param slots 所有的插槽
 * @param name 插槽名称
 * @param props 传入的参数
 * @returns @see createVNode
 */
export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (isFunction(slot)) {
      return createVNode("div", {}, slot(props));
    }
  }
}
