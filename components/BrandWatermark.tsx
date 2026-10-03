/**
 * Subtle global brand mark — rendered once from the app layout.
 * Sits behind all UI; never intercepts pointer events.
 */
export function BrandWatermark() {
  return (
    <img
      src="/ghostshift-watermark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none fixed z-0 select-none object-contain mix-blend-multiply
        bottom-[4%] right-[3%]
        w-[min(520px,45vw)]
        opacity-[0.05]
        grayscale-[10%]
        max-sm:bottom-[2%] max-sm:right-[2%]
        max-sm:w-[min(260px,68vw)]
        max-sm:opacity-[0.04]"
    />
  );
}
