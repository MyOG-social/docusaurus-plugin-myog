import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "bun:test"
import type { LoadContext } from "@docusaurus/types"

import { buildImageURL } from "../src/client/imageURL"
import { findConflicts } from "../src/conflicts"
import pluginMyOG from "../src/index"
import { DEFAULT_TEMPLATE, normalizeOptions } from "../src/options"
import { assertSupportedVersion, wrapSiteMetadata } from "../src/siteMetadata"

const packageDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)))
const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))

test("options require a plain account ID and a known template", () => {
  assert.deepEqual(normalizeOptions({ id: "default", account: " Ab12 " }), {
    account: "Ab12",
    template: DEFAULT_TEMPLATE,
  })
  assert.deepEqual(normalizeOptions({ account: "Ab12", template: "brand" }), {
    account: "Ab12",
    template: "brand",
  })
  for (const account of [undefined, "", "YOUR_ACCOUNT_HINT", "a b", "x".repeat(33)]) {
    assert.throws(() => normalizeOptions({ account }), /`account` must be/)
  }
  assert.throws(() => normalizeOptions({ account: "Ab12", template: "fancy" }), /`template`/)
  assert.throws(() => normalizeOptions({ account: "Ab12", url: "x" }), /unknown option\(s\): url/)
  assert.throws(() => normalizeOptions({ id: "second", account: "Ab12" }), /single instance/)
})

test("image URL encodes the full page URL like the install guide", () => {
  const imageURL = buildImageURL({
    account: "Ab12",
    template: "screenshot-right",
    siteURL: "https://docs.example.com",
    pathname: "/project/docs/guides/café & co/",
  })
  assert.equal(
    imageURL,
    "https://api.myog.social/og?a=Ab12&url=https%3A%2F%2Fdocs.example.com%2Fproject%2Fdocs%2Fguides%2Fcaf%C3%A9%20%26%20co%2F&template=screenshot-right&src=docs"
  )
  const params = new URL(imageURL).searchParams
  assert.deepEqual([...params.keys()], ["a", "url", "template", "src"])
  assert.equal(params.get("url"), "https://docs.example.com/project/docs/guides/café & co/")
})

test("static headTags image conflicts warn because Helmet cannot deduplicate them", () => {
  assert.deepEqual(findConflicts({}), [])
  for (const attributes of [{ property: "og:image" }, { name: "twitter:image" }]) {
    const [conflict] = findConflicts({ headTags: [{ tagName: "meta", attributes }] })
    assert.match(conflict, /headTags contains og:image or twitter:image outside Helmet/)
  }
  assert.deepEqual(
    findConflicts({
      headTags: [{ tagName: "link", attributes: { rel: "preconnect", href: "x" } }],
    }),
    []
  )
})

test("wraps the already-resolved classic, ejected or core fallback component without mutation", () => {
  const wrapper = "/plugin/lib/components/SiteMetadata.js"
  for (const original of [
    "/site/node_modules/@docusaurus/theme-classic/lib/theme/SiteMetadata/index.js",
    "/site/src/theme/SiteMetadata/index.tsx",
    "/site/node_modules/@docusaurus/core/lib/client/theme-fallback/SiteMetadata/index.js",
  ]) {
    const aliases = Object.freeze({
      "@theme/SiteMetadata": original,
      "@theme/Root": "/site/Root.tsx",
    })
    assert.deepEqual(wrapSiteMetadata({ aliases, wrapper }), {
      resolve: {
        alias: { "@theme/SiteMetadata": wrapper, "@myog-original/SiteMetadata": original },
      },
    })
    assert.equal(aliases["@theme/SiteMetadata"], original)
  }
})

test("missing or competing alias contracts fail with recovery instructions", () => {
  const wrapper = "/plugin/lib/components/SiteMetadata.js"
  for (const aliases of [
    undefined,
    [],
    {},
    { "@theme/SiteMetadata": false },
    { "@theme/SiteMetadata": "@theme-init/SiteMetadata" },
    { "@theme/SiteMetadata": wrapper },
    {
      "@theme/SiteMetadata": "/site/metadata.js",
      "@myog-original/SiteMetadata": "/other/metadata.js",
    },
  ]) {
    assert.throws(
      () => wrapSiteMetadata({ aliases, wrapper }),
      /Cannot wrap.*Use Docusaurus 3\.10\.2.*manual|Cannot wrap.*https:\/\/myog.social\/docs\/docusaurus/
    )
  }
})

test("compatibility is bounded to the tested core release", () => {
  assertSupportedVersion("3.10.2")
  for (const version of ["3.10.1", "3.10.3", "3.11.0", "4.0.0-alpha.0"]) {
    assert.throws(
      () => assertSupportedVersion(version),
      /is not supported.*Use @docusaurus\/core 3.10.2/
    )
  }
  assert.equal(manifest.peerDependencies["@docusaurus/core"], "3.10.2")
})

test("client and server hooks preserve the same alias and never provide a Root", () => {
  const plugin = pluginMyOG({ siteDir: packageDir, siteConfig: {} } as LoadContext, {
    account: "Ab12",
  })
  assert.equal(plugin.getThemePath, undefined)
  assert.equal(typeof plugin.configureWebpack, "function")
  const configure = plugin.configureWebpack as (config: unknown, isServer: boolean) => unknown
  const config = {
    resolve: { alias: { "@theme/SiteMetadata": "/site/src/theme/SiteMetadata.tsx" } },
  }
  assert.deepEqual(configure(config, false), configure(config, true))
  assert.deepEqual(config.resolve.alias, {
    "@theme/SiteMetadata": "/site/src/theme/SiteMetadata.tsx",
  })
})

test("package ships built components with no obsolete Root or runtime dependencies", () => {
  assert.equal(manifest.license, "MIT")
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.dependencies, undefined)
  assert.deepEqual(manifest.files, ["lib"])
  for (const built of [
    "lib/index.js",
    "lib/components/SiteMetadata.js",
    "lib/client/imageURL.js",
  ]) {
    readFileSync(join(packageDir, built), "utf8")
  }
  assert.equal(existsSync(join(packageDir, "lib/theme/Root")), false)
  const component = readFileSync(join(packageDir, "lib/components/SiteMetadata.js"), "utf8")
  const imports = [...component.matchAll(/from "([^"]+)"/g)].map(([, specifier]) => specifier)
  assert.deepEqual(imports.sort(), [
    "../client/imageURL.js",
    "@docusaurus/Head",
    "@docusaurus/router",
    "@docusaurus/useDocusaurusContext",
    "@docusaurus/useGlobalData",
    "@myog-original/SiteMetadata",
    "react/jsx-runtime",
  ])
})
