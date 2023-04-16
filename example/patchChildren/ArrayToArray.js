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
// const prevChildren = [
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
// ]


// 5.中间乱序的diff
// ab cd fg
// ab ec fg
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C', id: 'prev-c' }, "C"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'C', id: 'next-c' }, "C"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]

// 5.1.1中间乱序的diff
// a,b,(c,e,d),f,g
// a,b,(e,c),f,g  
// 期望： 删除d
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C', id: 'prev-c' }, "C"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'C', id: 'next-c' }, "C"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]

// 5.2 最长递增子序列
// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g  
// 期望： [1, 2]
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]

// 5.2 最长递增子序列
// a,b,(c,e),f,g
// a,b,(e,c,d),f,g  
// 期望： 创建d 
// const prevChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]
// const nextChildren = [
//     h("div", { key: 'A' }, "A"),
//     h("div", { key: 'B' }, "B"),
//     h("div", { key: 'E' }, "E"),
//     h("div", { key: 'C' }, "C"),
//     h("div", { key: 'D' }, "D"),
//     h("div", { key: 'F' }, "F"),
//     h("div", { key: 'G' }, "G"),
// ]

// a,b,(c,d,e,m),f,g
// a,b,(d,c,n,e),f,g
const prevChildren = [
    h("span", { key: 'A' }, "A"),
    h("span", { key: 'B' }, "B"),
    h("span", { key: 'C' }, "C"),
    h("span", { key: 'D' }, "D"),
    h("span", { key: 'E' }, "E"),
    h("span", { key: 'M' }, "M"),
    h("span", { key: 'F' }, "F"),
    h("span", { key: 'G' }, "G"),
]
const nextChildren = [
    h("span", { key: 'A' }, "A"),
    h("span", { key: 'B' }, "B"),
    h("span", { key: 'D' }, "D"),
    h("span", { key: 'C' }, "C"),
    h("span", { key: 'N' }, "N"),
    h("span", { key: 'E' }, "E"),
    h("span", { key: 'F' }, "F"),
    h("span", { key: 'G' }, "G"),
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