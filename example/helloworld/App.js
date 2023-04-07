import { h } from '../../lib/guide-mini-vue.esm.js'

export default {
    render () {
        return h("div", {
            tag: 'div',
            class: ['cs1', 'cs2']
        }, [
            h("p", { class: 'red title' }, "title"),
            h("span", { class: 'blue desc' }, "desc")
        ])
    },
    setup () {
        return {
            msg: 'Hello world, vue3 source'
        }
    }
}