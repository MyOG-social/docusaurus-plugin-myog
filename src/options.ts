export const PLUGIN_NAME = "docusaurus-plugin-myog"

export const TEMPLATES = [
  "brand",
  "screenshot",
  "screenshot-right",
  "screenshot-bottom",
  "screenshot-bottom-framed",
] as const

export type Template = (typeof TEMPLATES)[number]

export const DEFAULT_TEMPLATE: Template = "screenshot-right"

export type PluginOptions = {
  /** Your MyOG account ID, the `a=` value in the install snippet on https://myog.social/docs/docusaurus. */
  account: string
  /** Image layout. Defaults to `screenshot-right`. */
  template?: Template
}

export type MyOGGlobalData = {
  account: string
  template: Template
}

function fail(message: string): never {
  throw new Error(`[${PLUGIN_NAME}] ${message}`)
}

export function normalizeOptions(raw: unknown): MyOGGlobalData {
  const options = (raw ?? {}) as Record<string, unknown>
  const { id, account, template, ...unknown } = options
  if (id !== undefined && id !== "default") {
    fail("supports a single instance; remove the `id` option.")
  }
  const unknownKeys = Object.keys(unknown)
  if (unknownKeys.length > 0) {
    fail(`unknown option(s): ${unknownKeys.join(", ")}. Supported: account, template.`)
  }
  const trimmedAccount = typeof account === "string" ? account.trim() : ""
  if (!/^[A-Za-z0-9]{1,32}$/.test(trimmedAccount)) {
    fail(
      "`account` must be your MyOG account ID (letters and digits), copied from the install snippet at https://myog.social/docs/docusaurus."
    )
  }
  const chosenTemplate = template ?? DEFAULT_TEMPLATE
  if (!(TEMPLATES as readonly unknown[]).includes(chosenTemplate)) {
    fail(`\`template\` must be one of: ${TEMPLATES.join(", ")}.`)
  }
  return { account: trimmedAccount, template: chosenTemplate as Template }
}
