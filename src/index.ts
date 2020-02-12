import isEqual from 'lodash.isequal';

const DEFAULT_ITEMSIZE = 60;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_COLUMN = 1;

interface SizeAndPositionOfItemData {
  index: number;
  style: React.CSSProperties;
}

type ItemSize = number | number[] | ((index: number) => number);

export interface VirutalListItemData<T = any>
  extends SizeAndPositionOfItemData {
  item: T;
}

type MiniItemSizeValue = string | number;
type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

type VirutalListDataManagerChangeHandler<T> = (
  items: VirutalListItemData<T>[]
) => void;

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];

export interface VirutalListDataManagerOptions<T> {
  itemSize?: MiniItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  column?: number;
  onChange: VirutalListDataManagerChangeHandler<T>;
}

export interface ILoadStatusResult<T> {
  id: string;
  clearAndAddData: (...value: T[]) => void;
  clearAndSetData: (value: T[]) => void;
}

export interface VirutalListDataManagerState<T> {
  data: T[];
  itemSize: ItemSize;
  overscan: number;
  column: number;
  itemCount: number;
  estimatedSize: number;
  stickyIndices: number[];
  onChange: VirutalListDataManagerChangeHandler<T>;
}

let index = 0;
let RATIO = 1;

const VIRTUAL_LIST_DATA_MANAGER_FLAG = 'VIRTUAL_LIST_DATA_MANAGER_FLAG';
const toString = Object.prototype.toString;
const generateId = () => `__${index++}__${VIRTUAL_LIST_DATA_MANAGER_FLAG}`;
const LOAD_ITEM_DATA_ID = 'LOAD_ITEM_DATA_ID';

const defaultOptions: Omit<VirutalListDataManagerOptions<any>, 'onChange'> = {
  estimatedSize: DEFAULT_ITEMSIZE,
  itemSize: DEFAULT_ITEMSIZE,
  overscan: DEFAULT_OVERSCAN,
  column: DEFAULT_COLUMN
};

const getItemCount = <T>(data: T[], column: number) => {
  const length = data.length;

  if (column === 1) {
    return length;
  }

  let total = 0;
  let i = 0;

  while (i < length) {
    total += 1;

    let j = 1;
    let k = i;

    while (
      j < column &&
      // tslint:disable-next-line: no-conditional-assignment
      (k = i + j) < length &&
      // 非状态第点
      !(
        toString.call(data[k]) === '[object Object]' &&
        data[k][VIRTUAL_LIST_DATA_MANAGER_FLAG] === undefined
      )
    ) {
      j++;
    }

    i += j;
  }

  return total;
};

const itemSizeTransformer = (value: MiniItemSizeValue): number => {
  const parser = /^[+-]?\d+(\.\d+)?r?px$/;
  if (typeof value === 'string') {
    if (parser.test(value)) {
      return value.includes('rpx')
        ? (parseFloat(value) / 2) * RATIO
        : parseFloat(value);
    }
    throw Error('Invalid ItemSize types');
  }

  return value;
};

const itemSizeAdapter = (itemSize: MiniItemSize): ItemSize => {
  if (typeof itemSize === 'string') {
    return itemSizeTransformer(itemSize);
  }

  if (Array.isArray(itemSize)) {
    return itemSize.map(itemSizeTransformer);
  }

  if (typeof itemSize === 'function') {
    return (i: number) => {
      const val = itemSize(i);

      return itemSizeTransformer(val);
    };
  }

  return itemSize || 0;
};

const keys: (keyof VirutalListDataManagerState<any>)[] = [
  'estimatedSize',
  'itemSize',
  'overscan',
  'stickyIndices',
  'onChange',
  'column'
];

export class VirutalListDataManager<T = any> {
  private __lastSizeAndPositionData: SizeAndPositionOfItemData[] | null = null;
  private __state: VirutalListDataManagerState<T>;
  private __updater: VirutalListDataManagerUpdater<T> | null = null;
  private __onStateChange:
    | ((prevState: VirutalListDataManagerState<T>) => void)
    | null = null;
  private __timer = 0;

  constructor(options: VirutalListDataManagerOptions<T>, _Taro?: any) {
    const params = { ...defaultOptions, ...options };
    const state = { data: [] } as VirutalListDataManagerState<T>;

    // 因为 Taro 的 原因,  这里不能本身依赖于 _Taro
    if (typeof _Taro === 'object' && _Taro) {
      // web 上没有？
      if (_Taro.getSystemInfoSync) {
        RATIO = _Taro.getSystemInfoSync().windowWidth / 375;
      } else if (window !== undefined) {
        RATIO = window.innerWidth / 375;
      }
    }

    keys.forEach(key => {
      const item = params[key];

      if (params[key]) {
        state[key] = key === 'itemSize' ? itemSizeAdapter(item) : item;
      }
    });

    this.__state = state;
  }

  public updateConfig(config: Partial<VirutalListDataManagerOptions<T>>) {
    const state = this.__state;
    const prevState = { ...state };

    let needUpdated = false;

    keys.forEach(key => {
      const item = config[key];
      if (config[key] !== undefined) {
        if (key !== 'onChange' && state[key] !== item) {
          needUpdated = true;
        }
        state[key] = key === 'itemSize' ? itemSizeAdapter(item) : item;
      }
    });

    this.__updateItemCount();

    if (needUpdated) {
      this._triggerStateChange(prevState);
      this.__nextTickUpdate();
    }
  }

  public setLoadStatus = (
    customData: Record<string | number, any> = {},
    itemSizeOfLoadStatus?: MiniItemSizeValue
  ): ILoadStatusResult<T> => {
    let inserted = false;

    const id = generateId();
    const { itemCount, itemSize: rawItemSize } = this.__getState();

    const loadStatusData = {
      ...customData,
      [LOAD_ITEM_DATA_ID]: id,
      [VIRTUAL_LIST_DATA_MANAGER_FLAG]: VIRTUAL_LIST_DATA_MANAGER_FLAG
    };

    if (itemSizeOfLoadStatus !== undefined) {
      const newItemSize: ItemSize = (i: number) => {
        if (i === itemCount) {
          return itemSizeTransformer(itemSizeOfLoadStatus!);
        }

        if (typeof rawItemSize === 'function') {
          return rawItemSize(i);
        }

        return rawItemSize as number;
      };

      this.updateConfig({
        itemSize: newItemSize
      });
    }

    const reset = () => {
      if (itemSizeOfLoadStatus !== undefined) {
        this.updateConfig({
          itemSize: rawItemSize
        });
      }
    };

    // @ts-ignore
    this.push(loadStatusData);

    return {
      id,
      clearAndAddData: (...value: T[]) => {
        if (inserted) {
          return;
        }

        inserted = true;
        reset();
        this.clearAllLoadStatus(id);
        this.push(...value);
      },
      clearAndSetData: (value: T[]) => {
        if (inserted) {
          return;
        }

        inserted = true;

        reset();
        // 02.12 因为是直接设置数据 这里不再需要清除状态点
        // this.clearAllLoadStatus(id);
        this.set(value);
      }
    };
  };

  public clearAllLoadStatus = (id?: string) => {
    const data = this.get().filter(item =>
      typeof item === 'object' && item
        ? id
          ? item[LOAD_ITEM_DATA_ID] === undefined ||
            item[LOAD_ITEM_DATA_ID] !== id
          : item[LOAD_ITEM_DATA_ID] === undefined
        : true
    );

    this.set(data);
  };

  public getItemCount = () => {
    return this.__getState().itemCount;
  };

  public clear = () => {
    const { data, itemCount } = this.__state;

    data.length = 0;

    this.__updateItemCount();
    this._triggerStateChange({
      ...this.__state,
      itemCount
    });
    this.__nextTickUpdate();
  };

  public push = (...value: T[]): number => {
    const { data, itemCount } = this.__state;

    data.push(...value);

    this.__updateItemCount();
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();

    return this.__state.data.length;
  };

  public set = (value: T[]) => {
    const { itemCount } = this.__state;

    this.__state.data = value;

    this.__updateItemCount();
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();
  };

  public splice = (start: number, deleteCount: number = 0, ...items: T[]) => {
    const { itemCount } = this.__state;

    const removed = this.__state.data.splice(start, deleteCount, ...items);

    this.__updateItemCount();
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();

    return removed;
  };

  public pop = (): T | undefined => {
    const poped = this.__state.data.pop();

    this.__updateItemCount();

    return poped;
  };

  public get = (): T[] => {
    return this.__state.data;
  };

  public __nextTickUpdate() {
    this._nextTick(this._update);
  }

  private __updateItemCount(
    data = this.__state.data,
    column = this.__state.column
  ) {
    this.__state.itemCount = getItemCount(data, column);
  }

  public __getState() {
    return { ...this.__state };
  }

  public __setUpdater = (cb: VirutalListDataManagerUpdater<T>) => {
    this.__updater = cb;
  };

  public __setOnStateChange = (
    onStateChange: (prevState: VirutalListDataManagerState<T>) => void
  ) => {
    if (typeof onStateChange === 'function') {
      this.__onStateChange = onStateChange;
    }
  };

  public forceUpdate = () => {
    this._update(false);
  };

  public destroy = () => {
    // @ts-ignore
    this.__state = null;
    // @ts-ignore
    this.__onStateChange = null;
    // @ts-ignore
    this.__updater = null;
  };

  private _update = (check = true) => {
    if (typeof this.__updater === 'function') {
      const { onChange, data } = this.__state;
      const items = this.__updater(data);
      // 02/06 整个都参与比较 存在因为数据的不同渲染不同 DOM
      const sizeAndPositionOfItemData = items;

      if (this._checkShouldUpdate(sizeAndPositionOfItemData) && check) {
        this.__lastSizeAndPositionData = sizeAndPositionOfItemData;
        onChange(items);
      } else if (!check) {
        this.__lastSizeAndPositionData = sizeAndPositionOfItemData;
        onChange(items);
      }
    }
  };

  private _checkShouldUpdate(items: SizeAndPositionOfItemData[]) {
    return !isEqual(this.__lastSizeAndPositionData, items);
  }

  private _triggerStateChange = (prevState: VirutalListDataManagerState<T>) => {
    if (typeof this.__onStateChange === 'function') {
      this.__onStateChange(prevState);
    }
  };

  private _nextTick(cb: () => void) {
    this._clearTimer();
    // @ts-ignore
    this.__timer = setTimeout(() => {
      cb();
    }, 0);
  }

  private _clearTimer() {
    if (this.__timer) {
      clearTimeout(this.__timer);
      this.__timer = 0;
    }
  }
}

export default VirutalListDataManager;
