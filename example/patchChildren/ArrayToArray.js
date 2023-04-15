import { h, ref } from '../../lib/guide-mini-vue.esm.js'

// 1.左侧对比
// (ab) c
// (ab) de
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'E' }, "E"),
// ]

// 2.右侧对比
// a (bc)
// de (bc)
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
// ]
// const nextChildren = [
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
// ]

// 3.新的老的长
// 左侧 
// (ab) 
// (ab) c
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'D' }, "D"),
// ]

// 右侧
// (ab)
// c(ab) 
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]
// const nextChildren = [
//     h("div", { key: 'C1' }, "C1"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]

// 4.新的比旧的少 删除
// 左侧 (ab)c (ab)
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]

// 右侧 c(ab) (ab)
const prevChildren = [
    h("div", { key: 'C' }, "C"),
    h("div", { key: 'A' }, "A"),
    h("div", { key: 'B' }, "B"),
]
const nextChildren = [
    h("div", { key: 'A' }, "A"),
    h("div", { key: 'B' }, "B"),
]

export default {
    name: 'Array-to-Array',
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