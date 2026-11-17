"use client";

import Link from "./SafeLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSite, type Palette } from "./SiteProvider";
import { authClient } from "../lib/auth-client";

const navigation = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/quality", label: "Quality" },
  { href: "/contact", label: "Contact" },
];

function UserIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
}

function BasketIcon() {
  return <svg className="basket-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 9.5h15l-1.2 9H5.7l-1.2-9Z"/><path d="m8.3 9.5 3.7-5 3.7 5"/><path d="M9 13v2.5M15 13v2.5"/></svg>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { basketCount, basketActivity, palette, mode, reducedMotion, setPalette, setMode, setReducedMotion, resetTheme, session } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  useEffect(() => {
    if (!appearanceOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAppearanceOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [appearanceOpen]);

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/sign-in?signedOut=1&returnTo=%2F");
  }

  return (
    <>
      <div className="trade-bar">
        INDIA-WIDE TRADE ENQUIRIES <span>·</span> STRUCTURED PROCUREMENT <span>·</span> BUSINESS BUYERS ONLY
      </div>
      <header className="site-header">
        <div className="nav-shell">
          <Link className="brand" href="/" aria-label="Sparks Pharma home">
            <span className="brand-mark" aria-hidden="true">✦</span>
            <span>SPARKS <b>PHARMA</b></span>
          </Link>
          <nav className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                className={pathname.startsWith(item.href) ? "is-active" : ""}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <div className="theme-controls" aria-label="Appearance settings">
              <div className="theme-menu">
                <button className="mode-toggle" type="button" aria-label="Open appearance settings" aria-expanded={appearanceOpen} aria-controls="appearance-menu" onClick={() => setAppearanceOpen((open) => !open)}><span aria-hidden="true">◐</span></button>
                {appearanceOpen ? <div id="appearance-menu"><strong>Appearance</strong><label><span>Color theme</span><select aria-label="Color theme" value={palette} onChange={(event) => setPalette(event.target.value as Palette)}><option value="sky">Ocean</option><option value="galaxy">Galaxy</option></select></label><label><span>Mode</span><select value={mode} onChange={(event) => setMode(event.target.value as "light" | "dark" | "system")}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="motion-setting"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /><span>Reduce motion</span></label><button type="button" onClick={() => { resetTheme(); setAppearanceOpen(false); }}>Reset appearance</button></div> : null}
              </div>
            </div>
            <Link key={basketActivity} className={`quote-button ${basketActivity ? "is-bumping" : ""}`} href="/quote" aria-label={`Open quote basket, ${basketCount} ${basketCount === 1 ? "item" : "items"}`}>
              <BasketIcon /><span className="basket-count" aria-hidden="true">{basketCount > 99 ? "99+" : basketCount}</span><span className="basket-ping" aria-hidden="true" />
            </Link>
            {session ? (
              <details className="account-menu">
                <summary aria-label={session.role ? "Open dashboard menu" : "Open account menu"}>
                  <UserIcon />
                  <b>{session.role ? "Dashboard" : "Account"}</b>
                </summary>
                <div>
                  <strong>{session.displayName}</strong>
                  <small>{session.role ? session.role + " account" : "member account"}</small>
                  {session.role ? <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin dashboard</Link> : null}
                  <Link href="/account" onClick={() => setMenuOpen(false)}>Member workspace</Link>
                  <Link href="/account#quotes" onClick={() => setMenuOpen(false)}>Saved quotes</Link>
                  <Link href="/account#enquiries" onClick={() => setMenuOpen(false)}>Enquiries</Link>
                  <button type="button" onClick={signOut}>Sign out</button>
                </div>
              </details>
            ) : (
              <Link className="sign-in-control" href="/sign-in" aria-label="Sign in">
                <UserIcon /><b>Sign in</b>
              </Link>
            )}
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
