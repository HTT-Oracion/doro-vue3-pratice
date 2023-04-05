## 个人练习用 -- 实现 vue3 的最小模型

## 代码测试

使用 jest

```js
describe("reactive", () => {
  it("happay path", () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });

  test("nested reactive", () => {
    // 测试嵌套对象是否为响应式
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
```

## 代码编写原则 ：TDD 原则

```
1. 先写测试用例，再写产品代码
2. 只允许编写刚好能够导致失败的单元测试
3. 只允许编写刚好能够导致一个失败的单元测试通过的产品代码
```

实际上理解起来很容易：

第一点：先把测试用例编写了，然后先写出最基本的逻辑代码保证测试用例能够通过

第二点: 只写一个刚好能够导致失败的用例

第三点: 。。。

其中最重要的就是 先写测试代码，再写实际代码，最后完善和重构代码。
