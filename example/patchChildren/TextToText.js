import { h, ref } from '../../lib/guide-mini-vue.esm.js'

const nextChildren = "new Children"
const prevChildren = "old Children"

export default {
    name: 'text-to-text',
    setup () {
        const isChange = ref(false)
        window.isChange = isChange

        return {
            isChange
        }
    },
    render () {
        const self = this
        return self.isChange === true
            ? h("div", {}, nextChildren)
            : h("div", {}, prevChildren)
    }
}