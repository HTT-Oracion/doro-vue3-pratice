import { h } from '../../lib/guide-mini-vue.esm.js'
export default {
    name: 'foo',

    setup (props) {
        console.log(props);

        // // readonly
        props.count++
        // console.log(props);
    },

    render () {
        return h('div', {}, 'foo:' + this.count)
    }
}