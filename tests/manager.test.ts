import DataManager, { VirutalListDataManagerOptions } from '../src';
import { VirutalListDataManagerState } from '..';

const noop = () => undefined;
const sleep = (wait = 0) => new Promise(r => setTimeout(r, wait));

const createDataManager = <T = any>(
  params: VirutalListDataManagerOptions<T> = {
    onChange: noop
  }
) =>
  new DataManager({
    ...params
  });
const list = [1, 2];
const basicList = [1, 2, null, '', undefined, 'css'];

describe('DataManager', () => {
  it('push', () => {
    const manager = createDataManager();

    manager.push(...list);
    expect(manager.get()).toEqual(list);
  });

  it('pop', () => {
    const manager = createDataManager();
    manager.push(...list);

    const poped = manager.pop();
    expect(poped).toEqual(2);
    expect(manager.get()).toEqual(list.slice(0, 1));
  });

  it('splice', () => {
    const manager = createDataManager();
    const otherList = [3, 4];

    manager.push(...list);
    manager.splice(manager.get().length, 0, ...otherList);
    expect(manager.get()).toEqual(list.concat(otherList));

    manager.splice(0, manager.get().length);
    expect(manager.get()).toEqual([]);
  });

  it('clear', () => {
    const manager = createDataManager();

    manager.push(...list);
    manager.clear();
    expect(manager.get()).toEqual([]);
  });

  it('set', () => {
    const manager = createDataManager();

    manager.set([...list]);
    expect(manager.get()).toEqual(list);
  });

  it('destroy', () => {
    const manager = createDataManager();

    manager.set([...list]);

    manager.destroy();
    // @ts-ignore
    expect(manager.__state).toEqual(null);
  });

  it('itemCount when column is 1', () => {
    const manager = createDataManager();
    const data = [{ type: 'css' }, 'java'];
    manager.push(...list);

    expect(manager.getItemCount()).toEqual(list.length);
    manager.push(...data);
    expect(manager.getItemCount()).toEqual(list.length + data.length);
  });

  it('itemCount when column is greater than 1', () => {
    const manager = createDataManager({
      column: 2,
      onChange: noop
    });
    const data = [{ type: 'css' }, 'java'];

    manager.push(...basicList);
    expect(manager.getItemCount()).toEqual(Math.ceil(basicList.length / 2));
    manager.push(...data);
    expect(manager.getItemCount()).toEqual(Math.ceil(manager.get().length / 2));

    manager.updateConfig({
      column: 3
    });

    expect(manager.getItemCount()).toEqual(Math.ceil(manager.get().length / 3));
  });

  it('setLoadStatus', () => {
    const manager = createDataManager({
      column: 2,
      onChange: noop
    });
    const data = [{ type: 'css' }, ...basicList];

    manager.push(...data);

    const { clearAndAddData, clearAndSetData } = manager.setLoadStatus({
      type: 'loadMore'
    });
    const newData = manager.get();

    expect(newData.length).toEqual(data.length + 1);
    expect(newData[newData.length - 1].type).toEqual('loadMore');

    const addedData = { name: 'java' };
    clearAndAddData(addedData);
    const latestData = manager.get();

    expect(latestData.length).toEqual(data.length + 1);
    expect(latestData[latestData.length - 1]).toEqual(addedData);

    clearAndSetData([addedData]);
    expect(latestData.length).toEqual(data.length + 1);
  });

  it('onChange', async () => {
    let data: unknown;
    const onChange = jest.fn(value => (data = value));
    const manager = createDataManager({ onChange });
    const updater = jest.fn(value => [...value]);

    manager.__setUpdater(updater);
    manager.push(...list);

    // onChange 触发是异步的
    expect(updater.mock.calls.length).toEqual(0);
    await sleep();

    expect(updater.mock.calls.length).toEqual(1);
    expect(onChange.mock.calls.length).toEqual(1);
    expect(data).toEqual(list);
  });

  it('updateConfig', async () => {
    let data: unknown;
    let prevState: unknown;
    const onChange = jest.fn(value => (data = value));
    const manager = createDataManager({
      onChange
    });
    const updater = jest.fn(value => [...value]);
    const handleStateChange = jest.fn(prev => (prevState = prev));
    const mixedData = [{ type: 'css' }, ...basicList];

    manager.__setOnStateChange(handleStateChange);
    manager.__setUpdater(updater);
    manager.push(...mixedData);
    manager.updateConfig({
      column: 2
    });
    // stateChange 是同步触发 onChange 只在下一个事件循环调用一次
    expect(handleStateChange.mock.calls.length).toEqual(2);
    expect(updater.mock.calls.length).toEqual(0);
    await sleep();

    const { clearAndSetData } = manager.setLoadStatus({
      type: 'init'
    });

    // (+ updateConfig)
    expect(updater.mock.calls.length).toEqual(1);
    // 传入 itemSize 才会触发 stateChange 2 + 1 (push +  push)
    expect(handleStateChange.mock.calls.length).toEqual(3);
    await sleep(0);

    //  1 + 1 (+ push)
    expect(updater.mock.calls.length).toEqual(2);

    clearAndSetData([]);
    await sleep();

    // 3 + 1 (+ set)
    expect(handleStateChange.mock.calls.length).toEqual(4);
    // 2 + 1 (+ set)
    expect(updater.mock.calls.length).toEqual(3);
    clearAndSetData([]);

    await sleep();

    // 3 + 1 (+ set)
    expect(handleStateChange.mock.calls.length).toEqual(4);
    // 2 + 1 (+ set)
    expect(updater.mock.calls.length).toEqual(3);

    const { clearAndAddData } = manager.setLoadStatus(
      {
        type: 'loadMore'
      },
      '100rpx'
    );

    // 4 + 2 (+ updateConfig + push)
    expect(handleStateChange.mock.calls.length).toEqual(6);
    clearAndAddData(...[1, 2]);
    await sleep(0);
    // 3 + 1 ( + push)
    expect(updater.mock.calls.length).toEqual(4);
  });

  it('forceUpdate', async () => {
    let data: unknown;
    const onChange = jest.fn(value => (data = value));
    const manager = createDataManager({ onChange });
    const updater = jest.fn(value => [...value]);

    manager.__setUpdater(updater);

    manager.push(...list);
    manager.forceUpdate();

    expect(data).toEqual(list);
    expect(updater.mock.calls.length).toEqual(1);
  });
});
