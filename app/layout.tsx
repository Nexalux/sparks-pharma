import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { SiteProvider } from "./components/SiteProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "./lib/seo";

const title = SITE_NAME + " | India B2B Medicine Catalog";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    applicationName: SITE_NAME,
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    formatDetection: { telephone: false },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description: SITE_DESCRIPTION,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sparks Pharma social preview" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: ["/og.png"],
    },
};

function buildThemeScript(preference?: { palette: string; mode: string; reducedMotion: boolean }) {
  const accountPreference = preference && ["sky", "galaxy"].includes(preference.palette) && ["light", "dark", "system"].includes(preference.mode)
    ? { palette: preference.palette, mode: preference.mode, reducedMotion: Boolean(preference.reducedMotion) }
    : null;
  return `
  (function () {
    try {
      var account = ${JSON.stringify(accountPreference)};
      var palette = account ? account.palette : localStorage.getItem("sparks_palette_v1");
      var mode = account ? account.mode : (localStorage.getItem("sparks_mode_v1") || "system");
      var reducedMotion = account ? account.reducedMotion : localStorage.getItem("sparks_motion_v1") === "reduced";
      document.documentElement.dataset.palette =
        palette === "galaxy" ? "galaxy" : "sky";
      document.documentElement.dataset.mode = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : (mode === "dark" ? "dark" : "light");
      document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
    } catch (error) {
      document.documentElement.dataset.palette = "sky";
      document.documentElement.dataset.mode = "light";
      document.documentElement.dataset.motion = "full";
    }
  })();
`;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = buildThemeScript();
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
  };
  return (
    <html lang="en" data-palette="sky" data-mode="light" data-motion="full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }} />
      </head>
      <body>
        <SiteProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </SiteProvider>
      </body>
    </html>
  );
}
