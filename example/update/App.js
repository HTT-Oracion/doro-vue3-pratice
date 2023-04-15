import { h, ref } from '../../lib/guide-mini-vue.esm.js'
export default {
    render () {
        return h("div", {
            id: 'root'
        }, [
            h("div", {}, "count: " + this.count),
            h("button", {
                onClick: this.onClick
            }, 'click'),
        ])
    },
    setup () {
        const count = ref(0)

        const onClick = () => {
            count.value++
            console.log('click');
        }
        return {
            count,
            onClick
        }
    }
}