export const MYOG_IMAGE_ENDPOINT = "https://api.myog.social/og"

// Matches the install snippet on https://myog.social/docs/docusaurus: the page URL is the
// deployed site URL plus the route path, the same value Docusaurus emits as og:url.
export function buildImageURL({
  account,
  template,
  siteURL,
  pathname,
}: {
  account: string
  template: string
  siteURL: string
  pathname: string
}): string {
  const pageURL = siteURL + pathname
  return `${MYOG_IMAGE_ENDPOINT}?a=${encodeURIComponent(account)}&url=${encodeURIComponent(pageURL)}&template=${encodeURIComponent(template)}&src=docs`
}
