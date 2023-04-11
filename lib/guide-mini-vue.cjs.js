'use strict';

const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === "object";
const isArray = (val) => Array.isArray(val);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : "";
};

const targetMap = new Map();
// 触发依赖 (如 setter)
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 提取出来的目的是，初始化的时候就生成一个getter/setter
// 而不是每次调用mutableHandlers的时候再去生成
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// proxy hanlder
// 不可变的
const mutableHandlers = {
    get,
    set,
};
// readonly的
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} 是 readonly ，无法触发 set`, target);
        return true;
    },
};
// 表层readonly
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});
// proxy getter:
// 按照vue3的方式封装成一个高阶函数，根据是否是 readonly去判断是否要收集依赖
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // 调用的 isReactive
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        // 调用isReadonly
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 如果是shallow，则不需要对它的子属性进行响应式
        // 因为shallow的话，只有最外层是进行处理的
        if (shallow)
            return res;
        // 当前值是否为对象
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// proxy setter
// 保持代码结构一致性 、
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
// 表层只读
// 内层就不管了
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event, ...rawArgs) {
    const { props } = instance;
    // !!handlerName其实还要判断是不是 update:开头的 和 hook:开头的
    const handler = 
    // add => onAdd
    props[(toHandlerKey(event))] ||
        // add-foo => onAddFoo
        props[(toHandlerKey(camelize(event)))];
    handler && handler(...rawArgs);
}

function initProps(instance, props) {
    instance.props = props || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceHanlders = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            // 获取 setup上的属性
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            // 获取 props上的属性
            return props[key];
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
        props: {},
        emit: () => { },
    };
    componet.emit = emit.bind(null, componet);
    return componet;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, shallowReadonly(instance.vnode.props));
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
        const setupResult = setup(instance.props, {
            emit: instance.emit,
        });
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
    // vue3是通过 位 运算符去区分类型的
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 元素类型 typeof vnode.type === "string"
        processElement(vnode, container);
    }
    else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENTS */) {
        // 处理组件类型 isObject(vnode.type)
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
    const { children, props, shapeFlag } = vnode;
    // 需要判断children是数组还是字符串
    // 通过位运算符 &
    if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
        // isString(children)
        el.textContent = children;
    }
    else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
        // isArray(children)
        mountChildren(children, el);
    }
    for (const key in props) {
        const val = props[key];
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
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
function mountComponent(initialVNode, container) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode);
    // 处理setup
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    // 得到一个ast树,实际上就是一个描述虚拟节点的对象
    const subTree = instance.render.call(proxy);
    // 进行组件挂载
    patch(subTree, container);
    // 挂载完成后，将`mountElement`绑定的el取出
    initialVNode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props: props !== null && props !== void 0 ? props : {},
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        // type为string(如div)  0001 | 0100 => 0100
        // type为array(组件)  0010 | 0100 => 0100
        vnode.shapeFlag |= 8 /* ShapeFlags.TEXT_CHILDREN */;
        // type为string(如div) 0001 | 1000 => 1000
        // type为array(组件) 0010 | 1000 => 1000
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 4 /* ShapeFlags.STATEFUL_COMPONENTS */;
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

exports.createApp = createApp;
exports.h = h;
