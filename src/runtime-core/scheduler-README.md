## 为什么需要`nextTick`？

在 vue3 里，更新视图的操作是异步的，为什么是异步的？

举例：如果遇到下面这种情况，不停地更新视图，合理吗？

显然是不合理的

```js
const count = ref(1)
const instace = getCurrentInstance()
const updateCount = () => {
    for(let i = 0; i < 100; i ++) {
        console.log('update')
        count.value ++
    }
    console.log(instace)
}

// tempalte
render () {
    return h("div", {}, this.count)
}

```

如果是同步的，会执行 100 次更新，这样更新消耗的性能就会比较严重。

那么，vue3 是怎么去实现执行完 for 循环后再去更新视图保证更新次数较少的呢？

更新的时候，通过`scheduler`，把更新操作作为一个微任务，这样子，执行后循环后再去更新视图，就减少了性能的消耗

我们知道， `nextTick`的作用是用于获取最新的视图的内容的，因为 `scheduler`里 用`queneJobs` 把 原本的更新行为作为微任务了，因此此时 `instance.vnode.el`里的 count 值仍为 0， 期望值是 100

```js
// scheduler.ts
const quene: any[] = [];
let isFlushPending = false;
const p = Promise.resolve();

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queneJobs(fn) {
  if (!quene.includes(fn)) {
    quene.push(fn);
  }
  queneFlush();
}

function queneFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flubJobs);
}
function flubJobs() {
  isFlushPending = false;

  let job;
  while ((job = quene.shift())) {
    job && job();
  }
}
```

如上面的代码，通过`nextTick`再开启一个微任务，就可以了

原理:

```
执行顺序：
1.执行for循环里的逻辑 => scheduler() => queneJobs(instance.update)
2.queneJobs里创建一个 Promise.resolve[.then(fn)] // fn 实际上就是更新视图的逻辑
3.外部nextTick，创建了一个 Promise，此时这个微任务在event loop里面的顺序是放在 更新视图逻辑后面的
```

## 总结

1. vue3 视图更新是异步的，要保证能拿到最新的节点，需要使用 nextTick
2. vue3 更新的时候，把更新逻辑放在`scheduler()`，把更新视图的逻辑放到`queneJobs`里，会使用`Promise.resolve`新创建一个微任务（nextTick 本质就是把更新逻辑放到新创建的微任务里）
3. 此时如果再次调用`nextTick`，新创建一个微任务，这个任务的顺序会在 更新视图的任务后面，所以此时已经更新完毕，可以拿到最新的节点。
