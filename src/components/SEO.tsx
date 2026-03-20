import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object | object[];
  noindex?: boolean;
}

const SITE_NAME = 'NAVADHA Fashion Co';
const BASE_URL = 'https://navadha.com';
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function SEO({
  title = 'NAVADHA Fashion Co - Where Elegance Meets Contemporary Style',
  description = 'Discover premium quality fashion at NAVADHA. Shop our curated collection of elegant clothing, boutique pieces, ethnic wear, and new arrivals. Free shipping on orders above ₹2,999.',
  keywords = 'NAVADHA fashion, women clothing online India, ethnic wear, boutique fashion, designer wear, indo western, western wear, men fashion, online shopping India',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  structuredData,
  noindex = false,
}: SEOProps) {
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  const jsonLdArray = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      {/* Primary */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="language" content="English" />
      <meta name="author" content={SITE_NAME} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@navadha_fashion" />

      {/* Structured Data (JSON-LD) */}
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
