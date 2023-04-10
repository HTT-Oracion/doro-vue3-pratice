const isString = (val) => typeof val === "string";
const isObject = (val) => val !== null && typeof val === "object";
const isArray = (val) => Array.isArray(val);

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceHanlders = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    // type即当前的组件
    // 不知道为什么vue3里要写成type..，不太好理解
    // 格式为（举例）：
    //   ```{
    //     render() {
    //         return h("div", "hello" + this.msg)
    //     },
    //     setup() {
    //         return {
    //             msg: 123
    //         }
    //     }
    //   }
    //   ```
    const componet = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return componet;
}
function setupComponent(instance) {
    // initProps
    // initSlots
    // 初始化为有状态的组件
    setupStatefulComponent(instance);
}
// 初始化为有状态的组件
function setupStatefulComponent(instance) {
    // 当前组件
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceHanlders);
    // 获取setup的返回值
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
// 处理setup的返回值
// setup返回值可以是对象，也可以是函数
// 如果返回的是函数，则当作是render
function handleSetupResult(instance, setupResult) {
    // 为对象
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
    // 为函数
}
//
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

// 渲染器
function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    // !! 先判断vnode 的类型
    // 再进行处理
    // vue3是通过 >> 运算符去区分类型的
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理组件类型
        processComponent(vnode, container);
    }
}
// 处理普通 元素
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载普通元素
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, props } = vnode;
    // 需要判断children是数组还是字符串
    if (isArray(children)) {
        mountChildren(children, el);
    }
    else if (isString(children)) {
        el.textContent = children;
    }
    for (const key in props) {
        el.setAttribute(key, props[key]);
    }
    container.append(el);
}
// 挂载子节点
function mountChildren(vnode, container) {
    vnode.forEach((node) => {
        patch(node, container);
    });
}
// 处理组件
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 挂在组件
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    // 处理setup
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // 得到一个ast树,实际上就是一个描述虚拟节点的对象
    const subTree = instance.render.call(proxy);
    // 进行组件挂载
    patch(subTree, container);
    // 挂载完成后，将`mountElement`绑定的el取出
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 全部基于vnode
            // 1.把component => vnode
            const vnode = createVNode(rootComponent);
            // 2.进行渲染
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
