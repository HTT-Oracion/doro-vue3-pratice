// tips:
// 可读性较差，但性能好
// 修改值的时候，用 | （都为0时才为0）
// 查找时用 & 都为1时才为1
// 举例：
// 0001 | 1000 => 1000
// 查找是否为ELEMENT时: 用 ShapeFlags.ELEMENT & 目标shape，为true则是element
export const enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENTS = 1 << 2, // 0010
  TEXT_CHILDREN = 1 << 3, // 0100
  ARRAY_CHILDREN = 1 << 4, // 1000
}
