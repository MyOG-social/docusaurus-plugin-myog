# docusaurus-plugin-myog development

`README.md`, `LICENSE` and `lib/` ship in the package. This file, source and
tests stay in the repository.

## Build and verify

From the repository root, with Bun and pnpm installed:

```sh
pnpm install --ignore-scripts
bun run type-check
bun run lint
bun run test
pnpm exec prettier --check src tests package.json tsconfig.client.json README.md DEVELOPMENT.md
pnpm pack --pack-destination /absolute/task/release
```

The Node entry is CommonJS. `lib/components/SiteMetadata.js` and `lib/client`
are ESM consumed by Docusaurus. There are no runtime dependencies. Client imports
use Docusaurus aliases, the preserved component alias and `react/jsx-runtime`.
The MyOG service defines the accepted template names. Check those against the
plugin's `TEMPLATES` when changing image compositions.

## Design

`configureWebpack` receives the final resolved `@theme/SiteMetadata` alias. It
saves that exact path as `@myog-original/SiteMetadata`, then remaps the public
alias to the MyOG component. This preserves a site ejection, theme component or
core fallback. It neither supplies a theme path nor changes Root aliases.

The wrapper renders the original with its props, then MyOG `<Head>`. In core
3.10.2, App renders SiteMetadata after the global defaults and before route
content. MyOG therefore replaces global image defaults, while front matter and
MDX overrides win. Canonical, locale, title, description, custom metadata and
Root providers remain owned by the existing components. URL construction and
`src=docs` match the manual integration; no image request is made by the plugin.

The hook is public, but this alias-remapping technique and App order are not.
The peer range and runtime check require core 3.10.2. Missing/non-path aliases,
self-wrapping and a competing preserved alias fail with recovery instructions;
there is no silent fallback to `@theme-init`. An exact version check cannot
guarantee compatibility with patched core builds or competing alias plugins.
Do not widen support without checking the affected integration.

`themeConfig.image`, metadata-image and Root conflict warnings were removed.
Static `headTags` conflicts still warn because those tags are outside Helmet.

## Installed-package acceptance

Pack the plugin, then install the tarball in a separate Docusaurus 3.10.2 site
with `pnpm add /absolute/task/release/docusaurus-plugin-myog-0.1.0.tgz --ignore-scripts`.
Check the installed package rather than pointing imports at repository source.
Keep build logs, the tarball manifest and the tool versions with your test results.

Use a small matrix covering default config; `/project/` with trailing slash true
and false; ejected SiteMetadata with other metadata; replacing and wrapping site
Roots; another plugin Root; global image and metadata defaults; front matter
(including the same image as the global default) and MDX priority. Parse actual
HTML heads and assert semantic custom markers, canonical, URL encoding and
single image tags. Avoid third-party markup snapshots.

Build once with plain webpack (`future.v4: false` and
`future.faster: false`) and once with Rspack (`future.v4: true`,
`@docusaurus/faster` 3.10.2 installed). Confirm the emitted runtime identifies
the selected bundler. The earlier candidate fixture enabled `future.v4` and
therefore used Rspack; its old claim of webpack-only coverage was wrong.

The checked runtimes are core/classic 3.10.2, React/react-dom 19.3.1 and 18.3.1,
and Node 24.1.0 and 20.11.0. These are representative cases. Check hydration and
client navigation through default → front matter → default → MDX against
`serve`, then initial rendering and navigation against `start`. Use Agent
Browser background task tabs and isolated ports; never fetch the MyOG images.
