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
3.10.x, App renders SiteMetadata after the global defaults and before route
content. MyOG therefore replaces global image defaults, while front matter and
MDX overrides win. Canonical, locale, title, description, custom metadata and
Root providers remain owned by the existing components. URL construction and
`src=docs` match the manual integration; no image request is made by the plugin.

The hook is public, but this alias-remapping technique and App order are not.
The peer range and runtime check accept stable core `>=3.10.0 <4.0.0`; the
check rejects prereleases, including v4 canaries. Docusaurus announced 3.10 as
the last v3 minor, so later v3 releases are expected to be bugfix patches. Missing/non-path aliases, self-wrapping
and a competing preserved alias fail with recovery instructions; there is no
silent fallback to `@theme-init`. A version check cannot guarantee
compatibility with patched core builds or competing alias plugins.

Qualify the floor (3.10.0) and the latest 3.10.x patch before a release that
changes the range. If a new 3.10.x patch fails the fixture, ship a tighter
bound. Docusaurus 4 and any new major need a fresh qualification.

`themeConfig.image`, metadata-image and Root conflict warnings were removed.
Static `headTags` conflicts still warn because those tags are outside Helmet.

## Installed-package acceptance

Pack the plugin, then install the tarball in a separate Docusaurus 3.10.x site
with `pnpm add /absolute/task/release/docusaurus-plugin-myog-<version>.tgz --ignore-scripts`.
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
`@docusaurus/faster` at the core version installed). Confirm the emitted runtime identifies
the selected bundler. The earlier candidate fixture enabled `future.v4` and
therefore used Rspack; its old claim of webpack-only coverage was wrong.

A fresh 3.10.0 install resolves current webpack, and 3.10.0's webpackbar 6 fails
webpack 5.106+ validation before plugins run. The 3.10.0 webpack fixture pins
webpack 5.105.4 with a fixture-only pnpm override; 3.10.1+ and Rspack need none.

The full matrix ran on core/classic 3.10.2 with React/react-dom 19.3.1 and
18.3.1 and Node 24.1.0 and 20.11.0. The 3.10.0 floor ran plain webpack with
React 18 on Node 20, Rspack with React 19 on Node 24, and the core fallback.
npm and pnpm installed the packed plugin in a 3.10.1 site without peer errors.
These are representative cases. Check hydration and
client navigation through default → front matter → default → MDX against
`serve`, then initial rendering and navigation against `start`. Use Agent
Browser background task tabs and isolated ports; never fetch the MyOG images.
