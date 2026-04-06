---
title: Don't pass className to your components
description: Why className and style props make your life harder, not easier
published: 2026-04-06T11:22:00Z
keywords: [react, css, component-design, tailwind, typescript, design-systems]
atUri: "at://did:plc:hkutgcisjksjzjl7j2xwjbsw/site.standard.document/3mit5q4eqaf26"
---

I believe that not passing `className` or `style` props to components is an important principle for building scalable React applications. This post explains why, and what to do instead.

It should be clear that what is written here _does not_ apply to headless components.

The most apparent issue that can arise from passing these props is conflicting classes or properties.

```tsx
const Button = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`bg-primary font-semibold text-center ${className}`}
    >
      {children}
    </button>
  );
};

<div>
  <Button className="bg-green-500">Buy Now</Button>
</div>;
```

The button in this example will end up having the className `bg-primary font-semibold text-center bg-green-500` in the DOM. What background color will the button in the above code sample take on?

The answer depends on the order the classes appear in the compiled CSS, not the order they appear in the `className` string. This is almost certainly not what you intended, and not something you can reason about reliably at a glance.

Libraries like [tailwind-merge](https://github.com/dcastil/tailwind-merge) exist precisely to address this problem, but needing a workaround is a signal that the underlying design has a flaw.

Now, assuming you run into the above issue, how do you know _how many_ conflicting classes you have across the rest of the codebase? How about the question: "Which background colors can our button component currently use?" - would you be able to answer that?

This brings me to my next point: allowing a `className` or `style` prop to be passed makes it impossible to understand all states of a component without looking at every place it is used. Explicit props and TypeScript discriminated unions or enums make the full surface area of a component obvious at a glance.

```tsx
type ButtonProps = React.ComponentProps<{
  variant: "primary" | "secondary";
  size: "small" | "medium" | "large";
  onClick: () => void;
}>;
```

Looking at this type definition alone, you know the button has two variants, three sizes, and does exactly one thing on interaction. Compare that to a `className` prop, which tells you nothing: any string is valid, and the only way to know what strings are actually in use is to search every usage of the component.

The problem goes deeper than legibility, though. Programmatically reacting to the `className` prop is infeasible too. This is the last issue I want to highlight.

Say you have a `<SearchBar>` component that shows match counts when navigating through search results in a long document. When enough space is available, you want to show "2 / 18 occurrences". When space is tight, you want to shorten it to "2 / 18".

```tsx
<SearchBar
  query={query}
  onChange={setQuery}
  position={position}
  total={total}
  onMove={handleMove}
  className="max-w-96"
/>
```

How should the component react to the `max-w-96` class being passed? To the component, `max-w-96` is just a string. Trying to parse it and then calculate what pixel size it might correspond to sounds far too complex a solution for such a simple problem.

It would be easier to simply have a `size` prop and set the max width inside the component.

```tsx
const SearchBar = ({
  query,
  onChange,
  position,
  total,
  onMove,
  size,
}: SearchBarProps) => {
  return (
    <div className={size === "large" ? "max-w-96" : "max-w-48"}>
      <input value={query} onChange={(e) => onChange(e.target.value)} />
      <span>
        {position} / {size === "large" ? `${total} occurrences` : total}
      </span>
      <button onClick={() => onMove(-1)}>Previous</button>
      <button onClick={() => onMove(1)}>Next</button>
    </div>
  );
};

<SearchBar
  query={query}
  onChange={setQuery}
  position={position}
  total={total}
  onMove={handleMove}
/>;
```

Yes, CSS container queries can also solve the responsive part of this. But they are not ideal when the component needs to change its content based on available space, and they hide from the call site the fact that there is a meaningful difference between a "small" and a "large" search bar.

I hope these three examples illustrate my reason for this principle. So, what should you do instead of passing `style` or `className` props?

#### Alternatives

The alternatives I would reach for are the following:

1. **Explicit variants.** Model the visual states of your component as named props, as shown in the `Button` and `SearchBar` examples above.
2. **Full-width components with external constraints.** Make the component fill all available space, then control that space from the outside. Tools for constraining could be a wrapper `div` with a max-width, a grid column, or a flex container. The component doesn't need to know anything about its layout context; the parent handles that.

In all the years I've spent building React-based applications, these two alternatives have pretty much always worked for me. To be honest, I cannot recall a single non-headless component where I had to resort to passing a `className` or `style` prop instead.

If this principle feels familiar, it should. At its core, it addresses the same problem that CSS Modules and scoped styles solve: preventing unintended style bleed by eliminating the global, cascading nature of CSS[^1]. Passing `className` into a component reintroduces that problem, just one layer up and through props instead of selectors.

[^1]: ["The End of Global CSS" by Mark Dalgleish](https://medium.com/seek-blog/the-end-of-global-css-90d2a4a06284)
