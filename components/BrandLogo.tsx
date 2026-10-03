import Image from "next/image";

const LOGO_SRC = "/brand/ghostshift-logo.jpg";

type BrandLogoProps = {
  /** Where the logo appears — controls size/crop. */
  variant?: "sidebar" | "hero" | "header" | "inline";
  className?: string;
  priority?: boolean;
};

const variants: Record<
  NonNullable<BrandLogoProps["variant"]>,
  { width: number; height: number; className: string }
> = {
  sidebar: {
    width: 220,
    height: 72,
    className: "h-12 w-auto max-w-[200px] object-contain object-left",
  },
  hero: {
    width: 720,
    height: 240,
    className: "h-auto w-full max-w-xl object-contain",
  },
  header: {
    width: 180,
    height: 56,
    className: "h-8 w-auto max-w-[160px] object-contain object-left",
  },
  inline: {
    width: 140,
    height: 44,
    className: "h-7 w-auto max-w-[140px] object-contain",
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
