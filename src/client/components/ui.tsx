import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect, { type NativeSelectProps } from "@mui/material/NativeSelect";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { InputHTMLAttributes, PropsWithChildren, ReactElement } from "react";

const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({ className, variant = "primary", ...props }: Omit<MuiButtonProps, "variant" | "color"> & { variant?: ButtonVariant }): ReactElement {
  const muiVariant = variant === "primary" || variant === "danger" ? "contained" : variant === "secondary" ? "outlined" : "text";
  return <MuiButton className={className} variant={muiVariant} color={variant === "danger" ? "error" : "primary"} {...props} />;
}

export function Card({ className, children, ...props }: PropsWithChildren<PaperProps>): ReactElement {
  return <Paper component="section" elevation={0} className={cx("rounded-[24px] border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(29,27,32,.04)]", className)} {...props}>{children}</Paper>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): ReactElement {
  return <OutlinedInput fullWidth size="small" className={className} inputProps={props} />;
}

export function Select({ className, children, ...props }: NativeSelectProps): ReactElement {
  return <FormControl fullWidth size="small" className={className}><NativeSelect input={<OutlinedInput />} {...props}>{children}</NativeSelect></FormControl>;
}

export function Progress({ value }: { value: number }): ReactElement {
  return <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, value))} sx={{ height: 8, bgcolor: "#eee8f4" }} />;
}

export function PageTitle({ eyebrow, title, children }: PropsWithChildren<{ eyebrow?: string; title: string }>): ReactElement {
  return <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Typography variant="overline" color="primary" sx={{ display: "block", lineHeight: 1.6 }}>{eyebrow ?? "じかん帳"}</Typography><Typography component="h1" variant="h4">{title}</Typography></div>{children}</div>;
}

export function Empty({ children }: PropsWithChildren): ReactElement {
  return <Paper variant="outlined" className="rounded-[20px] border-dashed px-5 py-10 text-center text-sm text-muted">{children}</Paper>;
}
