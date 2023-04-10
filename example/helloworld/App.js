import { h } from '../../lib/guide-mini-vue.esm.js'
window.self = null
export default {
    render () {
        window.self = this
        console.log(this);
        return h("div", {
            tag: 'div',
            class: ['cs1', 'cs2']
        }, [
            h("p", { class: 'red title' }, "title"),
            h("span", { class: 'blue desc' }, "desc " + this.msg)
        ])
    },
    setup () {
        return {
            msg: 'Hello world, vue3 sourcexxx'
        }
    }
}