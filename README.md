# tsguard.macro - Typescript type guard macro

[![](https://img.shields.io/travis/com/vhfmag/tsguard.macro.svg)](https://travis-ci.com/vhfmag/tsguard.macro/)

Babel macro that automatically generates type guards for a given type (very much WIP). You'll need to install [`generic-type-guards`](https://npm.im/generic-type-guards) for this to work.

[![NPM](https://nodei.co/npm/tsguard.macro.png)](https://npmjs.org/package/tsguard.macro)

## Roadmap

- [x] Implement tests
- [ ] Support type references (e.g. `typeGuard<IProps>`)
- [ ] Support tuples
- [ ] Support mapped types
- [ ] Support rest operator
- [ ] Support index accessed types

## Usage

```ts
import typeGuard from "tsguard.macro";

const unsafeValue = await fetch(someUrl).then(res => res.json());

if (typeGuard<{ name: string; value?: number }>(unsafeValue)) {
  const safeValue: { name: string; value?: number } = unsafeValue;
}
```
