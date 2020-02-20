interface SizeAndPositionOfItemData {
  index: number;
  style: React.CSSProperties;
}

type ItemSize = number | number[] | ((index: number) => number);

export interface VirtualListItemData<T = any>
  extends SizeAndPositionOfItemData {
  item: T;
}

type MiniItemSizeValue = string | number;

type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

type VirtualListDataManagerChangeHandler<T> = (
  items: VirtualListItemData<T>[]
) => void;

type VirtualListDataManagerUpdater<T> = (data: T[]) => VirtualListItemData<T>[];

interface VirtualListDataManagerOptions<T> {
  itemSize?: MiniItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  column?: number;
  onChange: VirtualListDataManagerChangeHandler<T>;
}

interface ILoadStatusResult<T> {
  id: string;
  clearAndAddData: (...values: T[]) => void;
  clearAndSetData: (...values: T[]) => void;
}

export interface VirtualListDataManagerState<T> {
  data: T[];
  itemSize: ItemSize;
  overscan: number;
  column: number;
  itemCount: number;
  estimatedSize: number;
  stickyIndices: number[];
  onChange: VirtualListDataManagerChangeHandler<T>;
}

export class VirtualListDataManager<T = any> {
  constructor(options: VirtualListDataManagerOptions<T>, Taro?: any);

  updateConfig: (config: Partial<VirtualListDataManagerOptions<T>>) => void;
  getItemCount: () => number;
  clear: () => void;
  push: (...value: T[]) => number;
  set: (...value: T[]) => void;
  splice: (start: number, deleteCount: number, ...items: T[]) => T[];
  get: () => T[];
  pop: () => T | undefined;
  forceUpdate: () => void;
  destroy: () => void;
  setLoadStatus: (
    customData?: Record<string | number, any>,
    itemSizeOfLoadStatus?: MiniItemSizeValue
  ) => ILoadStatusResult<T>;
  clearAllLoadStatus: (id?: string) => void;

  __nextTickUpdate: () => void;
  __updateItemCount: (data?: T[], column?: number) => void;
  __getState: () => VirtualListDataManagerState<T>;
  __setUpdater: (cb: VirtualListDataManagerUpdater<T>) => void;
  __setOnStateChange: (
    onStateChange: (prevState: VirtualListDataManagerState<T>) => void
  ) => void;
}

export default VirtualListDataManager;
