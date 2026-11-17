import type { AnchorHTMLAttributes } from "react";

const RELEASE = "7";

type SafeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export default function SafeLink({ href, children, ...props }: SafeLinkProps) {
  const releaseHref = href.startsWith("/")
    ? (() => {
        const [pathAndQuery, hash] = href.split("#", 2);
        return `${pathAndQuery}${pathAndQuery.includes("?") ? "&" : "?"}release=${RELEASE}${hash ? "#" + hash : ""}`;
      })()
    : href;

  return <a href={releaseHref} {...props}>{children}</a>;
}
