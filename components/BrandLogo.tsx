import Image from "next/image";

/** Full GhostShift MEMORY AGENT banner */
const LOGO_SRC = "/brand/ghostshift-logo.jpg";

type BrandLogoProps = {
  /** Where the logo appears — controls size. */
  variant?: "sidebar" | "hero" | "header" | "inline";
  className?: string;
  priority?: boolean;
};

const variants: Record<
  NonNullable<BrandLogoProps["variant"]>,
  { width: number; height: number; className: string }
> = {
  sidebar: {
    width: 280,
    height: 96,
    className: "h-14 w-full max-w-[220px] object-contain object-left",
  },
  hero: {
    width: 960,
    height: 320,
    className: "h-auto w-full max-w-2xl object-contain drop-shadow-sm",
  },
  header: {
    width: 240,
    height: 72,
    className: "h-10 w-auto max-w-[200px] object-contain object-left sm:h-11",
  },
  inline: {
    width: 200,
    height: 64,
    className: "h-9 w-auto max-w-[180px] object-contain",
  },
};

export function BrandLogo({
  variant = "sidebar",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const cfg = variants[variant];
  return (
    <Image
      src={LOGO_SRC}
      alt="GhostShift Memory Agent"
      width={cfg.width}
      height={cfg.height}
      priority={priority}
      className={`${cfg.className} ${className}`.trim()}
    />
  );
}
