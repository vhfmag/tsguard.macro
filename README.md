# tsguard.macro - Typescript type guard macro

Babel macro that automatically generates type guards for a given type (very much WIP). You'll need to install [`generic-type-guards`](https://npm.im/generic-type-guards) for this to work.

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
