export function GlassFilterDefs() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <filter id="lg-distort" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
        <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}