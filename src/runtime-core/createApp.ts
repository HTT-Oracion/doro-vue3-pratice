import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 全部基于vnode
        // 1.把component => vnode
        const vnode = createVNode(rootComponent);
        // 2.进行渲染
        render(vnode, rootContainer, null);
      },
    };
  };
}
