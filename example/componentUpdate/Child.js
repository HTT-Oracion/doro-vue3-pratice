import { h } from '../../lib/guide-mini-vue.esm.js'
export default {
    name: 'Child',
    setup () {
    },
    render (proxy) {
        return h("p", {}, [h("div", {}, "Child props msg: " + this.$props.msg)])
    }
}