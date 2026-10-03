"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Ghost,
  History,
  Menu,
  Search,
  Server,
  X,
} from "lucide-react";
import type { Service } from "@/types/service";

const nav = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: History },
  { href: "/search", label: "Memory Search", icon: Search },
  { href: "/simulator", label: "Simulator", icon: Server },
  { href: "/record", label: "Record", icon: Ghost },
] as const;

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/incidents/")) return "Incident Intelligence";
  if (pathname.startsWith("/incidents")) return "Incidents";
  if (pathname.startsWith("/dashboard")) return "Overview";
  if (pathname.startsWith("/search")) return "Memory Search";
  if (pathname.startsWith("/simulator")) return "Simulator";
  if (pathname.startsWith("/record")) return "Record Memory";
  return "GhostShift";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mongoOk, setMongoOk] = useState<boolean | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [healthRes, servicesRes] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/services"),
        ]);
        if (!cancelled) {
          setMongoOk(healthRes.ok);
          const body = (await servicesRes.json()) as Service[] | { error?: string };
          if (Array.isArray(body)) setServices(body);
        }
      } catch {
        if (!cancelled) setMongoOk(false);
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isHome) {
    return <div className="min-h-full">{children}</div>;
  }

  const statusDot = (status: Service["status"]) => {
    if (status === "incident") return "bg-gs-critical";
    if (status === "warning") return "bg-gs-warning";
    return "bg-gs-success";
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-4 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gs-cyan to-gs-violet text-sm">
          <Ghost className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] gs-gradient-text">
            GHOSTSHIFT
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gs-muted">
            Memory agent
          </p>
        </div>
      </Link>

      <nav className="space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "border border-cyan-400/30 bg-cyan-400/10 text-white"
                  : "text-gs-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gs-muted">
          Systems
        </p>
        <ul className="mt-3 space-y-2">
          {services.map((service) => (
            <li key={service._id} className="flex items-center gap-2 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot(service.status)}`} />
              <span className="gs-mono text-slate-300">{service.name}</span>
            </li>
          ))}
          {services.length === 0 ? (
            <li className="text-xs text-gs-muted">No services loaded</li>
          ) : null}
        </ul>
      </div>

      <div className="mt-auto space-y-3 border-t border-gs-border px-4 py-4">
        <div className="flex items-center gap-2 text-xs">
          <Database className="h-3.5 w-3.5 text-gs-cyan" />
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              mongoOk === null
                ? "bg-gs-muted"
                : mongoOk
                  ? "bg-gs-success"
                  : "bg-gs-critical"
            }`}
          />
          <span className="text-gs-muted">
            MongoDB {mongoOk === null ? "…" : mongoOk ? "Connected" : "Offline"}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-gs-muted">
          Synthetic Demo Environment
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 border-r border-gs-border bg-gs-elevated/90 lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-gs-border bg-gs-elevated">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-gs-muted hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gs-border bg-[#080b10]/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-gs-border p-2 text-gs-muted lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gs-muted">
                  GhostShift
                </p>
                <h1 className="text-sm font-semibold text-white">
                  {pageTitle(pathname)}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-gs-border bg-gs-soft px-2.5 py-1 gs-mono text-gs-cyan">
                DEMO
              </span>
              <span className="rounded-full border border-gs-border bg-gs-soft px-2.5 py-1">
                <span
                  className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                    mongoOk ? "bg-gs-success" : "bg-gs-critical"
                  }`}
                />
                MongoDB {mongoOk ? "Connected" : "Checking"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">
                <span className="gs-pulse mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gs-cyan" />
                AI Memory Online
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
