import { h, renderSlots, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'
export default {
    name: 'foo',
    setup () {

        const currentInstance = getCurrentInstance()
        console.log('Foo: ins', currentInstance);
    },
    render () {
        console.log(this.$slots);
        const foo = h('p', {}, 'foo')
        // 具名插槽
        // 作用域插槽
        const count = 12
        return h('div', {}, [
            renderSlots(this.$slots, 'header', {
                count
            }),
            foo,
            renderSlots(this.$slots, 'footer')
        ])
    }
}