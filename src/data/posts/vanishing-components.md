---
title: Vanishing components are an anti-pattern
description: A component must always render its own root, whether it renders should be decided where it is used.
published: 2026-10-11T18:30:00+02:00
keywords: [react, typescript, clean code]
---

Continuing the theme of the last post, here's another pattern I've come to rely on: a component must always render a root of its own, with the single exception of a component that does nothing but forward the caller's `children`. A component should not be allowed to render nothing. It can leave out parts of what it renders, but it should never make its entire output conditional. I'm calling these _vanishing components_: components that hide themselves in a way the caller can't see.

A component may still conditionally render children, but when a child needs to disappear, the parent is the one that omits it. Let me give you an example:

What DOM do you expect the following React code to create?

```tsx
<Card.Header>
  <Card.Title>Migration status</Card.Title>
  <Card.Subtitle>Lorem ipsum</Card.Subtitle>
</Card.Header>
<Card.Body>
  <Banner>You are using deprecated APIs, please migrate by Oct 2028</Banner>
  <p>
    Lorem ipsum...
  </p>
</Card.Body>
```

You can't know which HTML tags the card components actually use, but you can roughly imagine the result. Let's say you like this sort of pattern and you've banned margin from your components, since a component can't know how much space the layout around it needs.[^1] Then the Banner would sit directly above the paragraph with no gap, so you want to give it some space. Since neither the Banner nor `Card.Body` accepts a `className` (see [Don't pass className to your components](/blog/classname-and-style-props)), you wrap the Banner in a div:

```tsx
<Card.Header>
  <Card.Title>Migration status</Card.Title>
  <Card.Subtitle>Lorem ipsum</Card.Subtitle>
</Card.Header>
<Card.Body>
  <div className="mb-4">
    <Banner>You are using deprecated APIs, please migrate by Oct 2028</Banner>
  </div>
  <p>
    Lorem ipsum...
  </p>
</Card.Body>
```

Now you've introduced a bug. The code looks totally straightforward, so how did that happen?

The Banner renders null once it's dismissed, which leaves an empty div with a margin at the top of the card.

If we enforce that a component shouldn't be allowed to decide whether it renders, the condition for hiding the banner would need to be placed in the parent. Let's move the condition and look at it again:

```tsx
<Card.Header>
  <Card.Title>Migration status</Card.Title>
  <Card.Subtitle>Lorem ipsum</Card.Subtitle>
</Card.Header>
<Card.Body>
  <div className="mb-4">
    {!isDismissed && <Banner>You are using deprecated APIs, please migrate by Oct 2028</Banner>}
  </div>
  <p>
    Lorem ipsum...
  </p>
</Card.Body>
```

This still contains the bug: the empty `<div className="mb-4">` is right there. The difference is that you can now see why. The condition is visible at the usage site, so it's obvious what to fix:

```tsx
<Card.Header>
  <Card.Title>Migration status</Card.Title>
  <Card.Subtitle>Lorem ipsum</Card.Subtitle>
</Card.Header>
<Card.Body>
  {/* ✓ wrapper and Banner disappear together */}
  {!isDismissed && (
    <div className="mb-4">
      <Banner>You are using deprecated APIs, please migrate by Oct 2028</Banner>
    </div>
  )}
  <p>
    Lorem ipsum...
  </p>
</Card.Body>
```

The full example, including state and dismissal logic, would then look something like this:

```tsx
function MigrationStatusCard() {
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <>
      <Card.Header>
        <Card.Title>Migration status</Card.Title>
        <Card.Subtitle>Lorem ipsum</Card.Subtitle>
      </Card.Header>
      <Card.Body>
        {/* ✓ wrapper and Banner disappear together */}
        {!isDismissed && (
          <div className="mb-4">
            <Banner>
              You are using deprecated APIs, please migrate by Oct 2028
            </Banner>
          </div>
        )}
        <p>Lorem ipsum...</p>
      </Card.Body>
    </>
  );
}
```

## Further Motivation

Often, a nice side effect of following this pattern is de-duplication. Conditions that were scattered across files get pulled to a common ancestor, and sometimes the original conditions were duplicates and can now be grouped together. A condition can only be evaluated where the data it depends on lives, so moving it up the tree pulls the fetching of that data up with it. Because following the pattern also pushes data fetching up the tree, it neatly ties in with [my last post about connected and presentational components](/blog/connected-components).

## When the condition gets complex

What if the logic behind your condition is too much code to inline in the parent?

**Use a pure function**

```tsx
<Card.Header>
  <Card.Title>Migration status</Card.Title>
  <Card.Subtitle>Lorem ipsum</Card.Subtitle>
</Card.Header>
<Card.Body>
  {!isBannerDismissed(bannerState) && (
    <div className="mb-4">
      <Banner>You are using deprecated APIs, please migrate by Oct 2028</Banner>
    </div>
  )}
  <p>
    Lorem ipsum...
  </p>
</Card.Body>
```

**Use a hook**

```tsx
const [isDismissed, setIsDismissed] = useBannerDismissal();
```

**Use a render prop**

```tsx
<Card.Body>
  <BannerStatus>
    {(isDismissed) =>
      !isDismissed && (
        <div className="mb-4">
          <Banner>
            You are using deprecated APIs, please migrate by Oct 2028
          </Banner>
        </div>
      )
    }
  </BannerStatus>
  <p>Lorem ipsum...</p>
</Card.Body>
```

The pure function, the hook, and a render prop together cover most of the gates people build wrapper components for. These are things like permissions and feature flags. The condition is still evaluated, just at the usage site, where it's visible instead of hidden inside a component that vanishes.

## Enforcement

I don't trust conventions that rely on people remembering them. At Langfuse I started enforcing this one with ESLint. Our internal `no-null-render` rule ([implementation](https://github.com/langfuse/langfuse/blob/main/packages/eslint-plugin/src/rules/no-null-render.ts)) inspects every return expression of a component and flags any branch that produces nothing, whether it's `null`, `undefined`, `false`, or an empty fragment:

```tsx
function Banner() {
  if (isDismissed) return null; // ✗ reports here
  return cond ? <Content /> : null; // ✗ and here
}
```

Leaving out _parts_ of a returned tree is still fine:

```tsx
return (
  <Card.Body>
    {!isDismissed && <Banner />} {/* ✓ */}
  </Card.Body>
);
```

There is one exception made for components whose entire output is the caller's `children` (or a `createPortal(children)`). Those are pure pass-throughs. They add no element, spacing, or styling of their own, so they can never produce the kind of orphaned wrapper the example above ran into. Everything else has to render something, and when a component can't, ESLint complains.

I've fixed a lot[^2] of these issues at Langfuse, and it almost always ended up as less code. I can't recall a single case where moving the condition to the caller made things worse: the component usually shrinks and the parent gets more obvious.

If you run this over your own codebase and hit a component it can't be moved out of, I'd be curious to hear about it.

[^1]: This is the rule from [Max Stoiber's "Margin considered harmful"](https://mxstbr.com/thoughts/margin). His point is encapsulation: margin adds invisible space outside a component's own visual boundary, so where it sits in the layout is not the component's business to decide.

[^2]: Here's the list: [PR 17354](https://github.com/langfuse/langfuse/pull/17354), [PR 17230](https://github.com/langfuse/langfuse/pull/17230), [PR 17225](https://github.com/langfuse/langfuse/pull/17225), [PR 17224](https://github.com/langfuse/langfuse/pull/17224), [PR 17223](https://github.com/langfuse/langfuse/pull/17223), [PR 17222](https://github.com/langfuse/langfuse/pull/17222), [PR 17219](https://github.com/langfuse/langfuse/pull/17219), [PR 17218](https://github.com/langfuse/langfuse/pull/17218), [PR 17175](https://github.com/langfuse/langfuse/pull/17175), [PR 17173](https://github.com/langfuse/langfuse/pull/17173), [PR 17172](https://github.com/langfuse/langfuse/pull/17172), [PR 17143](https://github.com/langfuse/langfuse/pull/17143), [PR 17021](https://github.com/langfuse/langfuse/pull/17021).
