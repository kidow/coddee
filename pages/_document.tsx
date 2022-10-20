import Document, { Html, Head, Main, NextScript } from 'next/document'
import type { DocumentContext } from 'next/document'
import { Children } from 'react'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return {
      ...initialProps,
      styles: Children.toArray(initialProps.styles)
    }
  }
  render() {
    return (
      <Html lang="ko" dir="ltr">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#000" />
          <meta name="robots" content="index, follow" />
          {/* <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="favicons/apple-icon-180x180.png"
          /> */}
          <meta
            name="google-site-verification"
            content="2R36y2-YBmRBsTj17QAXtE7GdzPcvmtoJN3_nyC3-cY"
          />
          <meta
            name="naver-site-verification"
            content="765241456c6b30f92b164c8a7b1f369bab47df98"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="favicon-16x16.png"
          />
          {/* <link rel="manifest" href="/manifest.json" /> */}
          <link
            rel="stylesheet"
            type="text/css"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          />
          <script
            defer
            src="https://cdn.feedbank.app/plugin.js"
            plugin-key="fa46598f-aa5e-46fc-be63-2d3e339383c5"
            data-fb-position="middle-right"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TBX834G');`
            }}
          />
          <meta name="msapplication-TileColor" content="#000" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
