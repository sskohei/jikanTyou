import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactElement, SelectHTMLAttributes } from "react";

const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }): ReactElement {
  return <button className={cx("inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-brand text-white shadow-sm hover:bg-brand-dark", variant === "secondary" && "bg-white text-ink ring-1 ring-line hover:bg-slate-50", variant === "ghost" && "text-muted hover:bg-slate-100", variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100", className)} {...props} />;
}

export function Card({ className, children }: PropsWithChildren<{ className?: string }>): ReactElement {
  return <section className={cx("rounded-3xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(31,41,72,.04)]", className)}>{children}</section>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): ReactElement {
  return <input className={cx("h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>): ReactElement {
  return <select className={cx("h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10", className)} {...props} />;
}

export function Progress({ value }: { value: number }): ReactElement {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function PageTitle({ eyebrow, title, children }: PropsWithChildren<{ eyebrow?: string; title: string }>): ReactElement {
  return <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-xs font-bold tracking-[.16em] text-brand">{eyebrow ?? "じかん帳"}</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1></div>{children}</div>;
}

export function Empty({ children }: PropsWithChildren): ReactElement {
  return <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">{children}</div>;
}
