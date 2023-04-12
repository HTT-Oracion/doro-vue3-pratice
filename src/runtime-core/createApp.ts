import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 全部基于vnode
      // 1.把component => vnode
      const vnode = createVNode(rootComponent);
      // 2.进行渲染
      render(vnode, rootContainer, null);
    },
  };
}
