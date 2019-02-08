// @ts-ignore
import tsguard from "../src/macro";
import * as tg from "generic-type-guard";

const toString = (value: unknown) =>
  typeof value === "symbol" ? String(value) : JSON.stringify(value);

const valuesToTest = [
  "",
  0,
  1,
  null,
  undefined,
  {},
  { name: "Maria", age: 24, isAlive: true },
  { name: "João", isAlive: false },
  { name: "Anônimo" },
  [],
  [1],
  [1, ""],
  ["", ""],
  Symbol(""),
];

const genPairs = (
  check: (val: unknown) => boolean,
): Array<[unknown, boolean]> =>
  valuesToTest.map<[unknown, boolean]>(v => [v, check(v)]);

const genTestName = (value: unknown, expected: boolean) =>
  `should ${expected ? "pass" : "fail"} for \`${toString(value)}\``;

const isLiteral = <T>(t: T) => (v: unknown): v is T => v === t;

const genTests = (
  checker: (value: unknown) => boolean,
  test: (value: unknown, expected: boolean) => () => void,
) => () => {
  genPairs(checker).map(([value, expected]) => {
    it(genTestName(value, expected), test(value, expected));
  });
};

describe("simple types", () => {
  describe(
    "string guard",
    genTests(tg.isString, (value, expected) => () =>
      expect(tsguard<string>(value)).toBe(expected),
    ),
  );

  describe(
    "number guard",
    genTests(tg.isNumber, (value, expected) => () =>
      expect(tsguard<number>(value)).toBe(expected),
    ),
  );

  describe(
    "boolean guard",
    genTests(tg.isBoolean, (value, expected) => () =>
      expect(tsguard<boolean>(value)).toBe(expected),
    ),
  );

  describe(
    "null guard",
    genTests(tg.isNull, (value, expected) => () =>
      expect(tsguard<null>(value)).toBe(expected),
    ),
  );

  describe(
    "undefined guard",
    genTests(tg.isUndefined, (value, expected) => () =>
      expect(tsguard<undefined>(value)).toBe(expected),
    ),
  );

  describe(
    "never guard",
    genTests(
      () => false,
      (value, expected) => () => expect(tsguard<never>(value)).toBe(expected),
    ),
  );

  describe(
    "any guard",
    genTests(tg.isAny, (value, expected) => () =>
      expect(tsguard<any>(value)).toBe(expected),
    ),
  );

  describe(
    "unknown guard",
    genTests(tg.isUnknown, (value, expected) => () =>
      expect(tsguard<unknown>(value)).toBe(expected),
    ),
  );

  describe(
    "object guard",
    genTests(tg.isObject, (value, expected) => () =>
      expect(tsguard<object>(value)).toBe(expected),
    ),
  );

  describe(
    "array guard",
    genTests(tg.isArray(tg.isString), (value, expected) => () =>
      expect(tsguard<string[]>(value)).toBe(expected),
    ),
  );

  describe(
    "type literal guard",
    genTests(
      v => v === 1,
      (value, expected) => () => expect(tsguard<1>(value)).toBe(expected),
    ),
  );

  const interfaceGuard = new tg.IsInterface()
    .withProperty("name", tg.isString)
    .withProperty("age", tg.isOptional(tg.isNumber))
    .withProperty("isAlive", tg.isBoolean);

  describe(
    "interface guard",
    genTests(interfaceGuard.get(), (value, expected) => () =>
      expect(
        tsguard<{ name: string; age?: number; isAlive: boolean }>(value),
      ).toBe(expected),
    ),
  );

  describe("union types", () => {
    describe(
      "string | number guard",
      genTests(tg.isUnion(tg.isString, tg.isNumber), (value, expected) => () =>
        expect(tsguard<string | number>(value)).toBe(expected),
      ),
    );

    describe(
      "null | undefined guard",
      genTests(tg.isUnion(tg.isNull, tg.isUndefined), (value, expected) => () =>
        expect(tsguard<null | undefined>(value)).toBe(expected),
      ),
    );
  });

  describe("intersection types", () => {
    describe(
      "{ name: string } & { isAlive: boolean } guard",
      genTests(
        tg.isIntersection(
          new tg.IsInterface().withProperty("name", tg.isString).get(),
          new tg.IsInterface().withProperty("isAlive", tg.isBoolean).get(),
        ),
        (value, expected) => () =>
          expect(tsguard<{ name: string } & { isAlive: boolean }>(value)).toBe(
            expected,
          ),
      ),
    );
  });
});

describe("complex types", () => {
  describe(
    "intersection and union guard",
    genTests(
      tg.isUnion(
        tg.isNumber,
        tg.isIntersection(
          new tg.IsInterface().withProperty("name", tg.isString).get(),
          new tg.IsInterface().withProperty("isAlive", tg.isBoolean).get(),
        ),
      ),
      (value, expected) => () =>
        expect(
          tsguard<number | ({ name: string } & { isAlive: boolean })>(value),
        ).toBe(expected),
    ),
  );
});
