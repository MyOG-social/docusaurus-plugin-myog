import path from "node:path"
import { readFileSync } from "node:fs"

import type { LoadContext, Plugin } from "@docusaurus/types"

import { findConflicts } from "./conflicts"
import { assertSupportedVersion, wrapSiteMetadata } from "./siteMetadata"
import { normalizeOptions, PLUGIN_NAME, type PluginOptions } from "./options"

export type { PluginOptions, Template } from "./options"

export default function pluginMyOG(context: LoadContext, options: PluginOptions): Plugin<void> {
  const coreManifest = require.resolve("@docusaurus/core/package.json", {
    paths: [context.siteDir],
  })
  const { version } = JSON.parse(readFileSync(coreManifest, "utf8")) as { version: string }
  assertSupportedVersion(version)
  const data = normalizeOptions(options)
  for (const conflict of findConflicts({
    headTags: context.siteConfig.headTags,
  })) {
    console.warn(`[${PLUGIN_NAME}] ${conflict}`)
  }

  return {
    name: PLUGIN_NAME,
    contentLoaded({ actions }) {
      actions.setGlobalData(data)
    },
    configureWebpack(config) {
      return wrapSiteMetadata({
        aliases: config.resolve?.alias,
        wrapper: path.join(__dirname, "components/SiteMetadata.js"),
      })
    },
  }
}
