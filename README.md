# docusaurus-plugin-myog

Adds an `og:image` and `twitter:image` to each page of a Docusaurus site. It
covers docs, versioned docs, blog posts, blog lists, tag pages and custom pages.
[MyOG.social](https://myog.social) generates each image from the page's URL,
using its content and branding automatically.

The plugin writes metadata. It does not fetch images or call MyOG during builds
or navigation. Social platforms request the image URL when they preview a page.

Maintained by [MyOG.social](https://myog.social). The plugin is MIT licensed;
the image service requires a paid plan or card trial.

## Requirements and tested support

- Docusaurus **3.10 or a later 3.x release**: stable `@docusaurus/core`
  `>=3.10.0 <4.0.0`. Tested with 3.10.0 and 3.10.2. The runtime check rejects
  older releases, prereleases and Docusaurus 4, which is not supported yet.
- Docusaurus 3.10.0 itself fails plain webpack builds with webpack 5.106 or
  newer, before any plugin runs (its webpackbar 6 dependency). 3.10.1 fixed
  this. Use 3.10.1 or later, or Rspack.
- Tested with the classic preset, React/react-dom **19.3.1** and **18.3.1**,
  Node.js **24.1.0** and **20.11.0**, plain **webpack** and **Rspack** builds.
  Rspack uses `@docusaurus/faster` at the core version with `future.v4: true`;
  the webpack fixture explicitly disables `future.v4` and `future.faster`.
  These are representative combinations, not every combination of those values.
- Node.js 20.11.0 or newer is required. Later Node releases are not all tested.
- A MyOG account with the site's domain registered and an active subscription
  or trial. Image generation and refreshes use the plan's credits. The plugin
  does not register domains, start trials or bypass usage limits.
- Your account ID, copied from the `a=` value in the install code on
  [the Docusaurus guide](https://myog.social/docs/docusaurus). It appears in each
  image URL and is not a secret.

The integration uses the documented `configureWebpack` hook, but remapping the
resolved theme alias and relying on core App's metadata render order are
**undocumented internal contracts**. The build fails if the required alias is
missing, unsafe to wrap, or the core version is unsupported. See
[DEVELOPMENT.md](https://github.com/MyOG-social/docusaurus-plugin-myog/blob/main/DEVELOPMENT.md)
for the verification recipe.

## Install

In your Docusaurus 3.10+ site:

```sh
pnpm add docusaurus-plugin-myog@^0.2.0
```

Add the plugin to `docusaurus.config.ts` (or `.js`):

```ts
export default {
  url: "https://docs.example.com",
  // ...
  plugins: [["docusaurus-plugin-myog", { account: "<account ID>" }]],
}
```

Keep `themeConfig.image` and `themeConfig.metadata` if you use them. MyOG replaces
their global `og:image` and `twitter:image` values; their other metadata stays.
Remove static `og:image` and `twitter:image` entries from `headTags`, because
Helmet cannot deduplicate them. The plugin warns about that conflict.

Run `pnpm run build`, then inspect the generated HTML's `<head>`. Each image
should appear once. On pages without an override, the MyOG URL's `url` parameter
should decode to that page's `og:url`.

## Options

| Option     | Required | Default            | Description                                                                                   |
| ---------- | -------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `account`  | yes      |                    | Your MyOG account ID (letters and digits).                                                    |
| `template` | no       | `screenshot-right` | `brand`, `screenshot`, `screenshot-right`, `screenshot-bottom` or `screenshot-bottom-framed`. |

The template selects the image composition. Automatic URL generation remains
the product workflow; there is no per-page template setup.

## Metadata priority and custom components

From lowest to highest priority:

1. Site defaults, including `themeConfig.image` and `themeConfig.metadata`.
2. The MyOG image for the current page.
3. A page's front matter `image` or MDX `<head>` image tags.

An MDX block that sets only `og:image` keeps MyOG's `twitter:image`. Set both
when both should use the override. A front matter image can equal the old
global image and still wins.

The plugin does not provide `@theme/Root`. Existing replacing or wrapping site
Roots and Roots from other plugins retain their normal Docusaurus behavior.
No Root wrapping or plugin ordering change is required for MyOG.

A site-ejected `SiteMetadata` is preserved: MyOG wraps the component already
resolved by Docusaurus and passes its props through. A theme's component or
core's empty fallback is handled the same way. The plugin does not substitute
`@theme-init/SiteMetadata`, which could discard theme or site metadata. A custom
component must retain any first-party metadata the site needs. Competing plugins
that remap this same alias are outside tested support.

## Limits

- `url`, `baseUrl` and `trailingSlash` must match the deployed site. The image
  URL uses `siteConfig.url` plus the current route path, matching Docusaurus's
  `og:url` in generated HTML.
- During client navigation, non-ASCII paths use the browser's percent-encoded
  pathname. Generated HTML retains Docusaurus's canonical URL representation.
- Each distinct page URL gets its own image; `/a` and `/a/` count separately.
  Generation and periodic refreshes use credits from the monthly allowance
  ([pricing](https://myog.social/pricing)). A large site can exhaust it.
- One plugin instance per site. Static `headTags` image tags must be removed.
- Verified with `docusaurus build`, `serve` hydration/client navigation and a
  `docusaurus start` smoke test. Only the `en` locale was tested. i18n locale
  paths and other themes are not verified. The experimental hash router is
  unsupported because it produces one HTML page.
- Social platforms cache images; use their debugger to refresh a card.

## Uninstall

Remove the plugin entry and run `pnpm remove docusaurus-plugin-myog`.
Docusaurus uses the existing theme image settings again.

## License

MIT
