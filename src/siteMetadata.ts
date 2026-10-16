import { isAbsolute } from "node:path"

import { PLUGIN_NAME } from "./options"

export function assertSupportedVersion(version: string): void {
  if (version !== "3.10.2") {
    throw new Error(
      `[${PLUGIN_NAME}] Docusaurus ${version} is not supported. Use @docusaurus/core 3.10.2 or remove this plugin and use the manual guide at https://myog.social/docs/docusaurus. The SiteMetadata integration requires the tested theme alias and App render-order contracts.`
    )
  }
}

export function wrapSiteMetadata({ aliases, wrapper }: { aliases: unknown; wrapper: string }) {
  const resolved = aliases as Record<string, unknown> | undefined
  const original = resolved?.["@theme/SiteMetadata"]
  if (
    !resolved ||
    Array.isArray(resolved) ||
    typeof original !== "string" ||
    !isAbsolute(original) ||
    original === wrapper ||
    resolved["@myog-original/SiteMetadata"] !== undefined
  ) {
    throw new Error(
      `[${PLUGIN_NAME}] Cannot wrap the resolved @theme/SiteMetadata alias safely. Use Docusaurus 3.10.2 and remove competing SiteMetadata alias remaps, or remove this plugin and use https://myog.social/docs/docusaurus. No fallback is substituted because it could discard your site's metadata.`
    )
  }
  return {
    resolve: {
      alias: {
        "@theme/SiteMetadata": wrapper,
        "@myog-original/SiteMetadata": original,
      },
    },
  }
}
