import { h } from '../../lib/guide-mini-vue.esm.js'
export default {
    name: 'foo',

    setup (props, { emit }) {
        console.log(props);

        // // readonly
        props.count++
        // console.log(props);
        const emitAdd = () => {
            console.log('emit add');
            emit('add', 1, 2)
            emit('add-foo', 1)
        }
        return {
            emitAdd
        }
    },

    render () {
        const Foo = h('div', {}, 'foo:' + this.count)
        const Btn = h('button', { onClick: this.emitAdd }, "emit Add")
        return h('div', {}, [Foo, Btn])
    }
}