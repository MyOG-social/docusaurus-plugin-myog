import Head from "@docusaurus/Head"
import { useLocation } from "@docusaurus/router"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import { usePluginData } from "@docusaurus/useGlobalData"
import OriginalSiteMetadata from "@myog-original/SiteMetadata"
import type { ComponentProps } from "react"

import { buildImageURL } from "../client/imageURL.js"

export default function SiteMetadata(props: ComponentProps<typeof OriginalSiteMetadata>) {
  const { siteConfig } = useDocusaurusContext()
  const { pathname } = useLocation()
  const { account, template } = usePluginData("docusaurus-plugin-myog") as {
    account: string
    template: string
  }
  const imageURL = buildImageURL({ account, template, siteURL: siteConfig.url, pathname })

  return (
    <>
      <OriginalSiteMetadata {...props} />
      <Head>
        <meta property="og:image" content={imageURL} />
        <meta name="twitter:image" content={imageURL} />
      </Head>
    </>
  )
}
