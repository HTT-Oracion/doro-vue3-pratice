import { h, ref, nextTick, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'

export default {
    name: 'App',
    setup () {
        const count = ref(1)
        const instance = getCurrentInstance()
        const onUpdate = () => {
            for (let i = 0; i <= 99; i++) {
                console.log('onUpdate')
                count.value++
            }
            nextTick(() => {
                console.log('nextTick?', instance);
            })
        }



        return {
            count,
            onUpdate
        }
    },
    render () {
        return h("div", {}, [
            h("button", { onClick: this.onUpdate }, "update: " + this.count),
            h("p", {}, "P" + this.count),
        ])
    }
} 