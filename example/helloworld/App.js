import { h } from '../../lib/guide-mini-vue.esm.js'
import Foo from './Foo.js'
window.self = null
export default {
    render () {
        window.self = this
        return h("div", {
            tag: 'div',
            class: ['cs1', 'cs2'],
            onClick: () => {
                console.log('click!!');
            }
        }, [
            h("p", { class: 'red title' }, "title"),
            h("span", { class: 'blue desc' }, "desc " + this.msg),
            h(Foo, { count: this.count })
        ])
    },
    setup () {
        return {
            msg: 'Hello world, vue3 sourcexxx',
            count: 11,
        }
    }
}