"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Search", match: (pathname: string) => pathname === "/" || pathname.startsWith("/companies") },
  { href: "/admin", label: "Overview", match: (pathname: string) => pathname === "/admin" },
  { href: "/admin/data", label: "Data", match: (pathname: string) => pathname.startsWith("/admin/data") },
  { href: "/admin/duplicates", label: "Duplicates", match: (pathname: string) => pathname.startsWith("/admin/duplicates") }
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/">
          <span className="site-brand__mark" aria-hidden="true">
            MX
          </span>
          <span>
            <span className="site-brand__name">Mexico Supplier Intelligence</span>
            <span className="site-brand__meta">DENUE evidence layer</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = item.match(pathname);

            return (
              <Link aria-current={active ? "page" : undefined} className="site-nav__link" data-active={active} href={item.href} key={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
