## VirtualListDataManager

[![Build Status](https://travis-ci.org/raohong/taro-list-data-manager.svg?branch=master)](https://travis-ci.org/raohong/taro-list-data-manager)

> 虚拟列表数据管理类， 启用虚拟滚动时必传

由于小程序不能动态渲染视图， 通过暴露一系列方法操作数据和更新配置, 然后再通过函数回调的方式把数据传给上层, 然后进行渲染。

更新数据的时候, 首先同步触发 `stateChange`, 得到当前总高度; 通过设置好的回调,在下一个事件循环中, 通知虚拟列表返回当前位置的数据。

更新 itemSize, column 等数据也会触发上一步骤。

#### 使用方式

```ts
const dataManager = new VirutalListDataManager({
  itemSize: 120,
  onChange: data => {
    this.setState({
      list: data
    });
  }
});
```

#### API

```ts
class VirutalListDataManager<T = any> {
  // 初始化参数
  constructor(options: VirutalListDataManagerOptions<T>);
  // 更新配置 参数等同 options
  updateConfig: (config: Partial<VirutalListDataManagerOptions<T>>) => void;
  // 清空数据
  clear: () => void;
  // push 数据 同 Array.prototype.push
  push: (...value: T[]) => number;
  // 设置数据
  set: (...value: T[]) => void;
  // 删除或者增加数据, 同 Array.prototype.splice
  splice: (start: number, deleteCount: number, ...items: T[]) => T[];
  // 获取整个数据
  get: () => T[];
  // 同 Array.prototype.pop
  pop: () => T | undefined;
  // 获取当前数据行数
  getItemCount: () => number;
  // 更新 Virtual List
  forceUpdate: () => void;
  // 设置加载状态 具体使用可参考 demo https://github.com/raohong/taro-list/blob/master/src/pages/list/index.tsx
  setLoadStatus: (
    customData?: Record<string | number, any>,
    itemSizeOfLoadStatus?: MiniItemSizeValue
  ) => ILoadStatusResult<T>;
  // 清空所有加载状态 (传入 ID 时清空该 ID)
  clearAllLoadStatus: (id?: string) => void;
}

// 初始化参数
interface VirutalListDataManagerOptions<T> {
  // 虚拟列表项目每个大小, 支持 number / string / number[] / string[] / () => string[] | number[] , 默认 50
  itemSize?: MiniItemSize;
  // 每行的列数 具体使用可参考 demo https://github.com/raohong/taro-list/blob/master/src/pages/list/index.tsx
  column?: number;
  // 项目估算大小 默认 60
  estimatedSize?: number;
  // sticky 数组, 通过 sticky 定位实现
  stickyIndices?: number[];
  // 提前渲染项目数量, 增大可避免快速滚动白屏, 默认 5
  overscan?: number;
  // 必传, 将当前要渲染的数据更新
  onChange: VirutalListDataManagerChangeHandler<T>;
}

type MiniItemSizeValue = string | number;
type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

interface SizeAndPositionOfItemData {
  index: number;
  style: ItemStyle;
}

interface VirutalListItemData<T = any> extends SizeAndPositionOfItemData {
  item: T;
}

type VirutalListDataManagerChangeHandler<T> = (
  items: VirutalListItemData<T>[]
) => void;

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];
```
