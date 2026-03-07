import { Helmet } from "react-helmet-async";

export default function Seo({
  title,
  description,
  canonical,
  ogImage = "https://cityhelp.app/og.png",
}) {
  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      {/* OpenGraph */}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      <meta property="og:type" content="website" />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? (
        <meta name="twitter:description" content={description} />
      ) : null}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
