import { h, provide, inject, createTextVNode } from '../../lib/guide-mini-vue.esm.js'

const Consumer = {
    name: 'Consumer',
    setup () {
        const foo = inject("foo")
        const bar = inject("bar")
        const baz = inject("baz", "baz")
        const ecc = inject("ecc", () => "ecc")
        return {
            foo,
            bar,
            baz,
            ecc
        }
    },

    render () {
        return h("div", {}, `Consumer: foo-${this.foo} ; bar-${this.bar} ; baz-${this.baz} ; ecc-${this.ecc}`)
    }
}

const ProviderTwo = {
    name: 'ProviderTwo',
    setup () {
        provide("foo", "fooTwo")
        const foo = inject("foo")
        return {
            foo
        }
    },
    render () {
        return h("div", { class: 'p2' }, [createTextVNode(`ProviderTwo ${this.foo}`), h(Consumer)])
    }
}

export default {
    name: 'Provider',
    setup () {
        provide("foo", "fooOne")
        provide("bar", "barOne")
    },
    render () {
        return h("div", { class: 'p1' }, [createTextVNode("Provider123"), h(ProviderTwo)])
    }
}
