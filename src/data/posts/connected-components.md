---
title: Connected and presentational components
description: My favorite way of organizing React codebases
published: 2026-09-10T08:40:00+02:00
keywords: [react, storybook, typescript, patterns, data-fetching, testing]
atUri: "at://did:plc:hkutgcisjksjzjl7j2xwjbsw/site.standard.document/3mv5h5h4n642a"
---

I've been meaning to write about this for ages. I believe for most applications splitting your React codebase into "Connected" and presentational components is most likely the single best architectural choice you can make. At Superchat we followed the pattern religiously. Now that I'm at Langfuse, code is not organized this way and it has made me a little uncomfortable with the codebase. I think it's almost as strong as the feeling I remember having after using TypeScript for a while and then going back to an untyped JavaScript codebase, so I thought it was finally time to sit down and write about it.

## The Pattern

What do I mean by "Connected" and presentational components? Quite simply, a connected component is allowed to interact with your API while a presentational component isn't. If you think about components as functions, which they essentially are, this pattern means splitting your functions into pure functions and functions with side-effects. Well, not perfectly pure functions, since you're not banning _all_ side-effects, only API calls.

You might have read about this pattern before. Dan Abramov wrote about [presentational and container components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) over a decade ago. What I'm arguing for here is really a subset of what he calls "Pure and Impure" components in his post, narrowed down to a single kind of impurity I care about: calling your API. Dan has since walked the broader pattern back, but I still believe this subset is one of the most useful ways of organizing a React codebase.

To actually differentiate them, I like to simply prefix component names with "Connected", and enforce via ESLint that components without the prefix can't make API calls, more on that later. At its core, it's similar to function coloring[^1], from the name alone, you know whether a component makes API calls or not. An example component directory in a project of mine might look like the following:

```sh
src/components/UserCard/ConnectedUserCard.tsx
src/components/UserCard/UserCard.tsx
src/components/UserCard/UserCard.stories.tsx
```

With the `ConnectedUserCard` being as simple as this:

```tsx
import React from "react";
import UserCard from "./UserCard";
import { useUser } from "@repo/react-api-client";

type UserCardProps = React.ComponentProps<typeof UserCard>;

type ConnectedUserCardProps = Omit<UserCardProps, "user"> & {
  user: { id: string };
};

function ConnectedUserCard(props: ConnectedUserCardProps) {
  const userQuery = useUser(props.user.id);

  if (!userQuery.data) {
    return <UserCard isLoading />;
  }

  const user = userQuery.data;

  return (
    <UserCard
      username={user.username}
      bio={user.bio}
      location={user.location}
    />
  );
}
```

## Predictability

Now looking at the example above, you might be wondering why I'd bother introducing this split. Why do I voluntarily add this additional boilerplate of a wrapping component over mixing the API with the presentation? What do I actually gain from lifting one API calling hook from the `UserCard` into the `ConnectedUserCard` wrapper? Let's look at the benefits.

Let's take the user card component from above and assume we don't have a formalized split between connected and presentational components. Is the following a good idea?

```tsx
{
  [alice, bob, simon, john].map((user) => (
    <UserCard key={user.id} user={user} />
  ));
}
```

I'd say if you are unsure whether the component does API requests, probably not. Let's say the component fetches some metadata of the user and then renders the user's name and a bio. This means the code above might now fire four API calls.[^2] Now imagine dropping it into a table with hundreds of rows, oblivious to its network behavior.
If, instead, I know the component is not doing an API call just by looking at its name, I can compose it any way I want as long as I am able to satisfy the prop types. This makes my component very predictable and thus leads to increased reusability.

## Testing Without a Network

The next major benefit I see is that testing components that do network requests in isolation is a pain. Most likely it means setting up network mocks or spinning up a server that serves the real API. Maybe it also means you're not going to bother with testing the component in isolation at all, instead you're simply going to pop it in its slot in the real page.tsx, run the dev server, log in, and click around. I hope you'd at least do that.
But let's face it, the feedback loop of clicking around in the real application is slow. Maybe it's not even possible to get to a component you want to test because it's buried in step five of the billing form that only appears when upgrading from an IP address detected to be in Japan. Now what? Are you going to rewrite the outer conditions just to be able to see the component once? What if you forget to put the right conditions back after testing? Maybe instead you could click through the flow using a proxy routed through Japan? Or change some rows in the database to place the system in the desired state?

With a component that renders data received via props, I don't need to do any of that. I just open it up in Storybook or place it on a temporary page and make sure to satisfy its prop types with a fixture. Compared to clicking around in the real application, this is easier, faster, and has the ability of being reliable when used in automated tests. That means people will actually do it. Not only that but coding agents will also have an easier time, as is often the case with tooling[^3].

Admittedly, the approach above wouldn't test the data fetching itself; you'd verify that separately. But being able to test most of your UI without a network is powerful. If you have a well-defined API and know the types of your responses, you can basically build out most of the UI of a newly planned feature simply by passing fixtures as props and then wiring up the components at the end through a shallow layer of connected components that contain simple API fetching hooks. In the end, all of this leads to increased reliability as UI is actually looked at and tests are actually written.

## Preview Deployments

As I mentioned above, my tool of choice for developing components in isolation is Storybook. It has the added benefit of being very simple and cost-effective to set up preview deployments as it can be compiled to static HTML, CSS, and JS which you can very cheaply serve. At Langfuse, we just push it to Vercel, and at Superchat, we uploaded it to S3 and pointed a CloudFront distribution at it. If I had to place preview deployment approaches in a quadrant of cost vs. usefulness, I think Storybook would generally come out as a no-brainer.

Here's my rundown of alternatives:

**Full application preview**  
By this I mean full preview environments that include a real backend and database.
This is very powerful as in theory it allows you to test any kind of change, but is complicated to set up and can be expensive. It's what we are currently doing at Langfuse.

**Client-only previews**  
By this I mean deploying the client-only, pointing it to a single staging or preview environment API.
It's much easier to do and generally cheaper since you don't need separate API server and database instances, but you lose the ability to make changes that span both client and API in the same PR. This is what we used to do at Superchat.

**Frontend with mocked backend**  
You can do this with tools such as [Mock Service Worker](https://mswjs.io). I have not done this myself as I always had both Storybook with the pattern described in this post and some sort of preview environment with a real API available, but I've read about [Oxide](https://oxide.computer) doing this well for their [console](https://github.com/oxidecomputer/console).
This can be done as a Storybook-only deployment that feels interactive, but you cannot test features end-to-end as the server is fake.

**Storybook-only previews**  
By this I mean, no API at all, just components with fixtures as props living in Storybook.
I'd argue this is easiest and cheapest. Downside being it's less interactive, you cannot test auth or API interactions etc. Especially with smaller changes that touch existing UI, a Storybook-only preview might be enough to verify a change is safe to merge.

This is also not necessarily an either/or question. Both now at Langfuse and previously at Superchat, we simply do both, having Storybook previews in addition to a way of testing the application in a more end-to-end manner.

Now the usefulness of Storybook scales with the amount of code it can cover and this is what the principle described here really gets to, sticking to it increases the share of the code that is easy to cover. I'd estimate at Superchat around 70% of the frontend code was not reliant on the API and could be tested in isolation, we could have probably pushed that to above 90% but sometimes took the slightly lazy route of prefixing a component with "Connected" and not bothering to split it up. This is another thing I like about this practice, it does not get in your way and there's an out for when you have to deliver fast.

## Loading States

The last advantage I wanted to highlight is that following the pattern gives you a natural boundary for loading states. Every connected component can return a skeleton version of the wrapped component. Because the presentational component is right there and driven purely by props, rendering a placeholder that mirrors its shape is easy, so more often than not the default loading state ends up being a skeleton rather than a spinner. The skeleton tells the user roughly what's coming and often can already match the final shape and dimensions so the page doesn't jump around when the data arrives. Spinners are a lazy default, and connected components make this obvious.

## Enforcing the Pattern

Now you might have read up to here and thought to yourself: "This sounds all nice in theory but I could never teach my team to stick to this in practice." Don't worry, I don't think coming up with principles like this without an automated way of enforcing them is any good either. To be honest, in the five years I was leading our frontend development at Superchat, I probably would have introduced my fair share of rule violations without being reminded of it and that was before the age of 10k LOC PRs from coding agents. Here's how we enforced the pattern:

We used ESLint with [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) which is a plugin meant to enforce architectural boundaries in your projects. It allows you to divide files into what it calls "elements" and then enforce the relationship of said elements. In the case of Superchat, we split components according to their filepath into connected and presentational components, then disallowed imports of our api-client in presentational components. We also disallowed importing the api-client from hooks. We then configured the boundaries plugin to disallow importing components whose names started with "Connected" in a component whose name didn't, effectively enforcing our way of function coloring.

To make this work, we exclusively used TanStack Query to make API calls. All the querying and mutation logic was abstracted into an internal `@superchat/api-client` package within our monorepo. This meant there was a single entry point that we could check for.

Here's a sample ESLint configuration on how this could be done:

```js
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      // Only look at boundary types within `src`
      "boundaries/include": ["src/**/*.{js,jsx,ts,tsx}"],

      // Define the "elements" boundaries knows about.
      "boundaries/elements": [
        {
          type: "hooks",
          mode: "file",
          pattern: "src/hooks/*.{js,ts}",
        },
        {
          type: "connected-components",
          mode: "file",
          pattern: "src/components/**/Connected*.{jsx,tsx}",
        },
        {
          type: "presentational-components",
          mode: "file",
          pattern: "src/components/**/*.{jsx,tsx}",
        },
      ],
    },
    rules: {
      // Keep the API client out of presentational components and out of hooks.
      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["presentational-components", "hooks"],
              disallow: ["@repo/react-api-client"],
              message:
                "Do not import @repo/react-api-client here. Only connected components may talk to the API client directly.",
            },
          ],
        },
      ],

      // Enforce the "function coloring" convention
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["presentational-components"],
              disallow: ["connected-components"],
              message:
                "Presentational components cannot import connected components. Pass data down as props instead.",
            },
          ],
        },
      ],
    },
  },
];
```

The one downside we saw was that we could not abstract complicated API logic into hooks, but we got around it by either doing the data fetching first and then passing the data to hooks, or using components with render props such as a `<UserPreferenceProvider>{(user) => ...}</UserPreferenceProvider>` over a `useUserPreference()`. We thought about introducing the connected / non-connected split also to hooks but never had a compelling enough argument to justify the additional complexity.

Coming back to Dan's original post from earlier, there are two places where I explicitly disagree with him. The first is his later update claiming the split is an implementation detail, that you should be able to replace a presentational component with a container without touching any call sites. I think that's exactly backwards: in our case the value of the split lives at the call site, you can tell from the component's name whether it will do network requests. Make it an implementation detail and you lose that. It's also why I don't follow his relaxed take on nesting, in my version a presentational component is never allowed to contain a connected one. The second is his view on logic: he originally argued to keep as much of it out of the presentational components, I'd argue the opposite, pack as much logic as you want into presentational components, all of it can then be easily tested in Storybook, just don't put any API calls in.

## Adopting the Pattern

If I were to go about adopting this in a greenfield project, I would actually be stricter than the version described so far. At Superchat, non-connected components were still allowed to access context, access session- or local storage or interact with the URL state, although the latter was discouraged and often discussed in code reviews. If I were starting from scratch I would consider restricting some of these too. Regarding URL state, for example, I've come to believe that components should ideally never read or modify URL state and the access should always be lifted to the framework boundary, e.g. a page. But I'll make that argument another time.

If you are not building a new application but are thinking about adopting this in your existing app, depending on the amount of existing code, this could be difficult. Normally, when adopting eslint rules you can grandfather existing violations by adding disable comments to them or using bulk suppressions but in this case this would not be a good idea, as it would not improve the predictability of the component. You still couldn't tell if it was doing an API request from looking at the component name alone. If you want to adopt this pattern in an existing app, I'd probably do one of the following:

**Adopt it for a newly built domain and scope the ESLint configuration to its folder.**  
The downside here is that you're not really getting the predictability of components or would at least always need to check where a component is imported from.

**Reverse it and use a file extension prefix.**  
Instead of marking connected components, mark presentational ones and instead of using the component name, you could use their filepath, e.g. `UserCard.presentational.tsx`. Then you could set up ESLint to enforce that presentational components cannot do API calls. This way you should be able to adopt this for newly written code only and keep the existing code you have untouched. Then over time, you could go through the application renaming files that already uphold the guarantees of presentational components and refactoring components that should but aren't. The downside here is that you cannot tell from the component name alone, which reduces the amount of information you get when reading JSX as you'd always need to cross-reference it with the import section at the top of the file. I'd not use the component's name for conveying the restrictions because this would lead to very ugly component names. Ideally you want most of your application's components to be pure, say ~90%. When prefixing the 10%, this feels natural - a `Button` keeps its name, same with a `UserCard`. When you're not prefixing the 10% connected components but the 90%, you'd also have to prefix components that obviously were not doing any network requests in the first place. Your `Button` would become `PresentationalButton`, your `Input` would become `PresentationalInput`, etc.

**Just rename every component and prefix it with "Connected".**  
Over time, you could then remove the prefix from components that don't need it. This would be a huge single change in git and I would not enjoy merging this beast of a PR, causing conflicts for everyone but if you're a solo developer, this might be the most pragmatic way to adopt this if actually cleaning up the code according to the original rule is too much work for a single PR.

## Where the Pattern Breaks Down

I'll close this post by looking at types of applications where I think this pattern might be difficult to apply. At Superchat we struggled with it when we started building our [Automations](https://www.superchat.com/product/automations) feature, which is similar to Zapier or n8n. In Automations, we had a lot of complicated logic for rendering nodes in an interactive canvas and the API calls would generally only happen quite far down in the component tree. This meant that following the principle laid out here, most of the components had to be prefixed with "Connected" since using a connected component as a child of a non-connected component is not allowed. You could get around this a bit by using render functions in props but it can get unwieldy quickly and the effort of working around the pattern might outweigh the benefits. Generally, if you'd need most of the components in your application to be connected, the pattern might not be worth it. But let's face it, many of us are not building these kinds of applications but rather traditional SaaS where most of the application is a collection of forms and tables. Even if you are building an application akin to Figma or Zapier, you might still have large parts of your application where this could be applied (think about all the settings pages). The nice thing about the pattern is that if splitting the components is too difficult, just prefix all of them with "Connected" and be done with it, you can always come back later and split components once you want to reuse them somewhere else.

[^1]: I have used the term function coloring for a while, but never _really_ knew where it originated from. While writing this post, I went looking for a suitable reference and [What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) came up as the source that apparently coined the term. The concept as I know it is about async functions and is generally considered a design flaw. I'm borrowing the term and applying it to components: a component's color is determined by whether it makes network calls, and, like async's color, decides where the component can be used. Instead of a flaw, I see the color as a feature and embrace the coloring rather than trying to design it away.

[^2]: I'm aware that if you are using GraphQL, queries might be merged and batched.

[^3]: If you're interested, Steve Klabnik argued for a similar point in [The most important thing when working with LLMs](https://steveklabnik.com/writing/the-most-important-thing-when-working-with-llms/#whats-good-for-the-goose-human-is-good-for-the-gander-llm).
