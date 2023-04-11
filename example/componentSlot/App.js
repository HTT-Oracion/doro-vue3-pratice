import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import Foo from './Foo.js'
export default {
    render () {
        const app = h('div', {}, 'App')
        // const foo = h(Foo, {}, "123")
        // const foo = h(Foo, {}, [h("p", {}, "123"), h("p", {}, "456")])
        // const foo = h(Foo, {}, [h("p", {}, "123")])
        // const foo = h(Foo, {}, h("p", {}, "123"))
        const foo = h(Foo, {}, {
            header: ({ count }) => h("p", {}, "header: count is" + count),
            footer: () => h("p", {}, "footer")
        })
        return h('div', {}, [app, foo, createTextVNode('text node')])
    },
    setup () {
        return {
            msg: 'Hello world, vue3 sourcexxx',
            count: 11,
        }
    }
}