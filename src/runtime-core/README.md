# createApp() 的流程

1. 首先 调用 `createVNode()` 创建一个虚拟节点，然后调用`render()`, `render()`实际上是调用的`patch()`

2. `createVNode()`里，通过`ShapeFlags`定义的组件类型，定义了当前的`shapeFlag`

> 备注：实际上`h(type, props?, children?)`函数也是`createVNode`，如下实例代码

```js
import { h } from "../../lib/guide-mini-vue.esm.js";
window.self = null;
export default {
  render() {
    window.self = this;
    console.log(this);
    return h(
      "div",
      {
        tag: "div",
        class: ["cs1", "cs2"],
      },
      [
        h("p", { class: "red title" }, "title"),
        h("span", { class: "blue desc" }, "desc " + this.msg),
      ]
    );
  },
  setup() {
    return {
      msg: "Hello world, vue3 sourcexxx",
    };
  },
};
```

2. `patch(vnode, container)`判断 vnode.type 类型  
   如果是`element`类型，调用`processElement()`处理，
   如果是`component`类型，调用`processComponent()`

- `processElement()`:
  - 调用`mountElement(vnode, container)`挂载元素，通过 `vnode.type`(如 div, span... 即 `h`函数的第一个参数)创建一个`element`，然后保存到`vnode.el`里
  - 判断`vnode.children`是否为数组，详见上方`App.js`代码和`h`函数的参数,如果是数组，说明不是纯文本，需要把`children`全部`patch`；如果是 string 类型，则直接赋值给`el.textContent`
  - 处理 props: 将`props`赋值到`el`上：`el.setAttribute(key, props[key]);`
    > props 是一个对象

---

- `processComponent()`: 先创建一个`component`的对象，得到一个`instance`

  - 处理`setup`：

    1. 初始化 props: `initProps`
    2. 初始化 slots: `initSlots`
    3. 初始化为有状态的组件: `setupStatefulComponent`,
       首先要给`instance.proxy`加一个`Proxy`，用于访问`$el, $options, $data`；
       处理 setup 的返回值, `setup`返回值可以是对象，也可以是函数, 如果返回的是函数，则当作是`render`, 如果为对象，将返回值保存到`instance.setupState`里（当使用`this.xxx`时，可以通过上方设置的`instance.proxy`里的代理获取到）
    4. 最后，将 instance 的 render 设置为 compoent 的 render，再调用这个 render

    ```js
    function setupRenderEffect(instance: any, vnode: any, container: any) {
      const { proxy } = instance;
      // 得到一个ast树,实际上就是一个描述虚拟节点的对象
      const subTree = instance.render.call(proxy);

      // 进行组件挂载
      patch(subTree, container);
      // 挂载完成后，将`mountElement`绑定的el取出
      vnode.el = subTree.el;
    }
    ```
