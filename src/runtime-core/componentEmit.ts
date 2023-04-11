import { camelize, toHandlerKey } from "../shared/index";

export function emit(instance, event, ...rawArgs) {
  const { props } = instance;

  let handlerName;

  // !!handlerName其实还要判断是不是 update:开头的 和 hook:开头的
  const handler =
    // add => onAdd
    props[(handlerName = toHandlerKey(event))] ||
    // add-foo => onAddFoo
    props[(handlerName = toHandlerKey(camelize(event)))];

  handler && handler(...rawArgs);
}
