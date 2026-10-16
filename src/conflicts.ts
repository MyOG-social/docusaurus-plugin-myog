const IMAGE_META_KEYS = new Set(["og:image", "twitter:image"])

type Metadatum = { name?: unknown; property?: unknown }

export function findConflicts({ headTags }: { headTags?: unknown }): string[] {
  const staticTags = Array.isArray(headTags) ? (headTags as { attributes?: Metadatum }[]) : []
  return staticTags.some(
    (tag) =>
      IMAGE_META_KEYS.has(String(tag?.attributes?.property)) ||
      IMAGE_META_KEYS.has(String(tag?.attributes?.name))
  )
    ? [
        "headTags contains og:image or twitter:image outside Helmet, which puts a second image tag on every page. Remove those entries.",
      ]
    : []
}
