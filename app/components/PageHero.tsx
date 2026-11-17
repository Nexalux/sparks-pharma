import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
  aside,
  code = "SP / 01",
  signals = ["Discover", "Review", "Enquire"],
  className = "",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  aside?: ReactNode;
  code?: string;
  signals?: [string, string, string];
  className?: string;
}) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <div>
        <span className="eyebrow"><i />{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {aside ? <div className="page-hero-aside">{aside}</div> : null}
      <div className="page-hero-rail" aria-hidden="true">
        <span className="page-hero-code">{code}</span>
        {signals.map((signal, index) => (
          <span className="page-hero-signal" key={signal}>
            <b>{String(index + 1).padStart(2, "0")}</b>{signal}
          </span>
        ))}
      </div>
    </section>
  );
}
