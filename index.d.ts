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

interface VirutalListDataManagerOptions<T> {
  itemSize?: MiniItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  column?: number;
  onChange: VirutalListDataManagerChangeHandler<T>;
}

interface ILoadStatusResult<T> {
  id: string;
  clearAndAddData: (...values: T[]) => void;
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

export class VirutalListDataManager<T = any> {
  constructor(options: VirutalListDataManagerOptions<T>);

  updateConfig: (config: Partial<VirutalListDataManagerOptions<T>>) => void;
  getItemCount: () => number;
  clear: () => void;
  push: (...value: T[]) => number;
  set: (...value: T[]) => void;
  splice: (start: number, deleteCount: number, ...items: T[]) => T[];
  get: () => T[];
  pop: () => T | undefined;
  forceUpdate: () => void;
  destroy: () => void;

  __nextTickUpdate: () => void;
  __getState: () => VirutalListDataManagerState<T>;
  __setUpdater: (cb: VirutalListDataManagerUpdater<T>) => void;
  __setOnStateChange: (
    onStateChange: (prevState: VirutalListDataManagerState<T>) => void
  ) => void;
}
