import type { Metadata } from "next";

export const SITE_NAME = "Sparks Pharma";
export const SITE_ORIGIN = process.env.SPARKS_SITE_ORIGIN || "https://sparks-pharma.pages.dev";
export const SITE_DESCRIPTION =
  "A B2B generic medicines catalog for India-wide trade enquiries, with Gujarat as the primary service region.";

const SOCIAL_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Sparks Pharma social preview",
};

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title,
      description,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
