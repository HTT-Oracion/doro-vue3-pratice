import { createRenderer } from '../../lib/guide-mini-vue.esm.js'
import App from './App.js'

const pixi = new PIXI.Application({
    width: 500,
    height: 500
})

document.body.append(pixi.view)
const renderer = createRenderer({
    createElement (type) {
        console.log('custom createElement', type);
        if (type === 'rect') {
            const rect = new PIXI.Graphics()
            rect.beginFill(0xff0000)
            rect.drawRect(0, 0, 100, 100)
            rect.endFill()
            return rect
        }
    },
    patchProp (el, key, val) {
        console.log('custom patchProp', el, key, val);
        el[key] = val
    },
    insert (el, parent) {
        console.log('insert', el, parent);
        parent.addChild(el)
    }

})


renderer.createApp(App).mount(pixi.stage)