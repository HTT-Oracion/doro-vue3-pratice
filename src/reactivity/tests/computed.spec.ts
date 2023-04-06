import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      age: 1,
    });
    const age = computed(() => {
      return user.age;
    });
    expect(age.value).toBe(1);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });

    const getter = jest.fn(() => {
      return value.foo;
    });

    const cValue = computed(getter);
    // lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toBeCalledTimes(1);

    // 不会再次compute
    cValue.value; // 第一次触发computed
    expect(getter).toBeCalledTimes(1);

    value.foo = 2; // 第二次触发compued
    // 由于没有调用.value，因此 getter 不会重新执行
    expect(getter).toBeCalledTimes(1);

    expect(cValue.value).toBe(2);
    expect(getter).toBeCalledTimes(2);

    cValue.value; // 不会重新触发
    expect(getter).toBeCalledTimes(2);
  });
});
