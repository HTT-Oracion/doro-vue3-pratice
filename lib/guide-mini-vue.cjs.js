'use strict';

const EMPTY_OBJ = {};
const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === "object";
const isArray = (val) => Array.isArray(val);
const isFunction = (val) => typeof val === "function";
const hasChanged = (val, newVal) => !Object.is(val, newVal);
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

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
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
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
        // type为string(如div) 0001 | 1000 => 1000
        // type为array(组件) 0010 | 1000 => 1000
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // slots?
    // 虚拟节点为组件类型 且 children为object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENTS */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENTS */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

/**
 * 返回对应插槽的虚拟节点
 * @param slots 所有的插槽
 * @param name 插槽名称
 * @param props 传入的参数
 * @returns @see createVNode
 */
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// 当前触发effect的实例
let activeEffect;
// 是否要收集依赖
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true; // 区分是否调用了`stop`. （false则为调用了`stop`）
        this._fn = fn;
    }
    run() {
        // 如果点击了stop
        // 执行并直接返回传入的函数 不进行依赖收集
        if (!this.active) {
            return this._fn();
        }
        // 先打开track开关 再重置
        shouldTrack = true;
        activeEffect = this;
        /**
         * 执行传入的函数
         * 如 obj.prop ++
         * 此时会触发 getter(track)再触发 setter(trigger)
         * @see{track}
         * @see{trigger}
         */
        const result = this._fn();
        // 待函数执行完毕 关闭track开关.
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // 移除依赖
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 清空deps
    effect.deps.length = 0;
}
const targetMap = new Map();
// 收集依赖 （如getter）
function track(target, key) {
    if (!isTracking())
        return;
    // reactive是根据 target => key 去收集依赖的
    // ref不需要，因为ref只有.value
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 如果已经收集过依赖了
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
// 是否是正在跟踪（收集依赖）
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // _effect.onStop = options.onStop;
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
// 是否是响应式对象
function isReactive(value) {
    // 触发getter即可
    // 如果不是reactive对象，则默认没有 ‘IS_REACTIVE’
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
        return target;
    }
    return new Proxy(target, baseHandlers);
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
// proxyRefs hanlder
const shallowUnrefHandlers = {
    get(target, key) {
        return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
        const oldValue = target[key];
        // 分几种情况
        if (isRef(Reflect.get(target, key)) && !isRef(value)) {
            // 1.原值是ref, 新值不是ref，则更新.value
            oldValue.value = value;
            return true;
        }
        else {
            // 2.其他情况：新值是ref，则直接替换
            return Reflect.set(target, key, value);
        }
    },
};
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
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
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

var _a;
const IS_REF = "__v_isRef";
class RefImpl {
    constructor(value) {
        this[_a] = true;
        // 如果传入的是对象，则把它转换为 reactive
        // 并且保存原始值
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
_a = IS_REF;
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref[IS_REF];
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    // 取值的时候 如果是ref， 返回.value
    // 否则原值返回
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, shallowUnrefHandlers);
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
    $slots: (i) => i.slots,
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

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
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
        isMounted: false,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        subTree: {},
    };
    componet.emit = emit.bind(null, componet);
    return componet;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, shallowReadonly(instance.vnode.props));
    // initSlots
    initSlots(instance, instance.vnode.children);
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
        setCurrentInstance(instance);
        const setupResult = setup(instance.props, {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
// 处理setup的返回值
// setup返回值可以是对象，也可以是函数
// 如果返回的是函数，则当作是render
function handleSetupResult(instance, setupResult) {
    // 为对象
    if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
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
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent && currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
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

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    // 渲染器
    function render(vnode, container, parentComponent) {
        patch(null, vnode, container, parentComponent);
    }
    // n1：旧
    // n2: 新
    // 有n1时为更新操作
    function patch(n1, n2, container, parentComponent) {
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
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 元素类型 typeof vnode.type === "string"
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENTS */) {
                    // 处理组件类型 isObject(vnode.type)
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    // 处理text node
    // children是传过来的文本内容
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 处理Fragment
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    // 处理普通 元素
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    // 挂载普通元素
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        // 需要判断children是数组还是字符串
        // 通过位运算符 &
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // isString(children)
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
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
    function patchElement(n1, n2, container) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
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
    function mountChildren(children, container, parentComponent) {
        children.forEach((node) => {
            patch(null, node, container, parentComponent);
        });
    }
    // 处理组件
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    // 挂在组件
    function mountComponent(initialVNode, container, parentComponent) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 处理setup
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
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
            }
            else {
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
