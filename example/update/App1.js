import { h, ref } from '../../lib/guide-mini-vue.esm.js'
export default {
    render () {
        return h("div", {
            id: 'root', ...this.props
        }, [
            h("div", {}, "count: " + this.count),
            h("button", {
                onClick: this.onClick
            }, 'click'),
            h("button", {
                onClick: this.onChangeProp1
            }, 'onChangeProp1'),
            h("button", {
                onClick: this.onChangeProp2
            }, 'onChangeProp2'),
            h("button", {
                onClick: this.onChangeProp3
            }, 'onChangeProp3'),
        ])
    },
    setup () {
        const count = ref(0)
        const props = ref({
            foo: 'foo',
            bar: 'bar'
        })

        const onClick = () => {
            count.value++
            console.log('click');
        }

        const onChangeProp1 = () => {
            props.value.foo = 'new foo'
        }

        const onChangeProp2 = () => {
            props.value.foo = undefined
        }

        const onChangeProp3 = () => {
            props.value = {
                foo: 'foo'
            }
        }

        return {
            count,
            props,
            onClick,
            onChangeProp1,
            onChangeProp2,
            onChangeProp3
        }
    }
}