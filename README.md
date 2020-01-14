## @zyou/mention

---

[![Build Status](https://travis-ci.org/raohong/mention.svg?branch=master)](https://travis-ci.org/raohong/mention) [![Coverage Status](https://coveralls.io/repos/github/raohong/mention/badge.svg?branch=master)](https://coveralls.io/github/raohong/mention?branch=master)

一个 mention 组件

> 来源。业务中有提及需求，比较重要的是，选中 一个 mention 后，删除是整体删除，参考 PC 微信端，利用正则简要轻便实现了此功能

#### Install

`npm i @zyou/mention`

#### Usage

```tsx
import Mention from '@zyou/mention';

const MentionOption = Mention.Option;

<Mention>
  <MentionOption value='nickname'>nickname</MentionOption>
  <MentionOption value='小美'>小美</MentionOption>
</Mention>;
```

#### API

props

| name         | type                                | required | default   | description                                                                                  |
| ------------ | ----------------------------------- | -------- | --------- | -------------------------------------------------------------------------------------------- |
| value        | string                              | false    | undefined | Mention value                                                                                |
| defaultValue | string                              | false    | undefined | Mention initial value                                                                        |
| placeholder  | string                              | false    | undefined | Mention placeholder                                                                          |
| placement    | 'top' or 'bottom'                   | false    | 'bottom'  | Mention Dropdown position                                                                    |
| autoResize   | boolean                             | false    | true      | Whether textarea enable autoresize                                                           |
| rows         | number or {min: number, max:number} | false    | 1         | autoresize size config                                                                       |
| onChange     | (value:string) => void              | false    | undefined | Mention value changed callback                                                               |
| onSearch     | (value:string) => void              | false    | undefined | Mention search custom handle                                                                 |
| prefix       | string[] or string                  | false    | '@'       | Trigger character                                                                            |
| split        | string                              | false    | ' '       | In the not controlled mode, when you insert a mention, the characters added before and after |
