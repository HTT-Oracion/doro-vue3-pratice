import { h, } from '../../lib/guide-mini-vue.esm.js'

import ArrayToText from './ArrayToText.js'
import ArrayToArray from './ArrayToArray.js'
import TextToText from './TextToText.js'
import TextToArray from './TextToArray.js'

export default {
    name: 'App',
    setup () { },
    render () {
        return h("div", { tId: 1 }, [
            h("p", {}, "App index"),
            // h(ArrayToText),
            // h(TextToText),
            // h(TextToArray),
            h(ArrayToArray),
        ])
    }
}