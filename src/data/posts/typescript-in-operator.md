---
title: Prefer explicit discriminators over "x" in y in TypeScript
description: A look at why the "x" in y syntax in TypeScript can lead to dead code.
published: 2026-02-14T12:07:00+01:00
keywords: [typescript, discriminator, union, dead code]
---

In TypeScript, using the `if ("x" in y)` syntax alters the definition of `y`, since the compiler understands it as a guard statement, it will permit all subsequent property accesses of x. In practice this can lead to dead code. Often, a better approach is using explicit discriminator properties instead.

Let me give you an example:

```ts
type Strawberry = {
  acidity: number;
};

type Mango = {
  acidity: number;
};

type Fruit = Strawberry | Mango;

function printMetadata(fruit: Fruit) {
  if ("acidity" in fruit) {
    console.log(fruit.acidity);
  }

  if ("sweetness" in fruit) {
    console.log(fruit.sweetness);
  }
}
```

This code snippet is valid and does not produce any compile-time issues, but according to the definition of the `Fruit` type, it never has a "sweetness" property, so the `if("sweetness" in fruit)` condition doesn't make much sense. TypeScript will not warn about the condition itself and it will also not complain about the subsequent use of the checked-for property. The compiler is doing what it's told: since you checked for the property, so it assumes it might be there. This might seem logically incorrect but since TypeScript was meant to be incrementally adopted and type definitions used to often be incorrect, especially when many external libraries still used to be written in pure JavaScript with type definitions provided after the fact.

In practice, this means using the `"x" in y` syntax will often produce undetectable dead code. The most common scenario I've personally noticed is using the `"x" in y` syntax to check for discriminated unions, then later deciding to remove one of the variants, forgetting to remove the condition.

A better approach uses an explicit discriminator:

```ts
type Strawberry = {
  type: "strawberry";
  acidity: number;
};

type Mango = {
  type: "mango";
  acidity: number;
};

type Fruit = Strawberry | Mango;

function printMetadata(fruit: Fruit) {
  if (fruit.type === "strawberry" || fruit.type === "mango") {
    console.log(fruit.acidity);
  }
}
```

Now, it's impossible to construct an `if fruit.type ===` condition that would allow you to access `fruit.sweetness` and the compiler will complain anytime you try to.

While the `in` operator has its place, especially when dealing with truly unknown or untyped data from external sources, it should be avoided when working with well-defined union types. Using an explicit discriminator property in these cases leads to more robust and refactor-friendly code, letting the compiler do its job of catching errors for you.
