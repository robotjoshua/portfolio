'use client';

export function Clouds8Bit() {
  return (
    <div className="cb-wrap" aria-hidden="true">
      <svg
        viewBox="0 0 48 32"
        preserveAspectRatio="xMidYMid meet"
        className="cb-svg"
        shapeRendering="crispEdges"
      >
        <rect x="0" y="0" width="48" height="12" className="cb-sky-hi" />
        <rect x="0" y="12" width="48" height="6" className="cb-sky-mid" />
        <rect x="0" y="18" width="48" height="7" className="cb-sky-lo" />

        <rect x="6" y="3" width="1" height="1" className="cb-pxl" />
        <rect x="22" y="2" width="1" height="1" className="cb-pxl" />
        <rect x="38" y="4" width="1" height="1" className="cb-pxl" />
        <rect x="13" y="7" width="1" height="1" className="cb-pxl" />
        <rect x="44" y="8" width="1" height="1" className="cb-pxl" />

        <polygon
          points="0,20 8,15 16,17 24,13 33,16 42,14 48,15 48,24 0,24"
          className="cb-px"
          opacity="0.45"
        />

        <g className="cb-rock">
          <circle cx="34" cy="11" r="8" className="cb-px" />
          <circle cx="34" cy="11" r="7" className="cb-pxm" />
          <rect x="28" y="6" width="3" height="1" className="cb-pxl" />
          <rect x="27" y="7" width="2" height="1" className="cb-pxl" />
          <rect x="27" y="8" width="1" height="2" className="cb-pxl" />
          <rect x="29" y="8" width="1" height="1" className="cb-pxl" />
          <rect x="38" y="14" width="2" height="1" className="cb-px" />
          <rect x="39" y="13" width="2" height="1" className="cb-px" />
          <rect x="40" y="12" width="1" height="1" className="cb-px" />
          <rect x="36" y="15" width="3" height="1" className="cb-px" />
          <rect x="33" y="10" width="1" height="1" className="cb-pxn" />
          <rect x="31" y="12" width="1" height="1" className="cb-pxn" />
          <rect x="35" y="9" width="1" height="1" className="cb-pxn" />
          <rect x="30" y="14" width="1" height="1" className="cb-pxn" />
        </g>

        <polygon points="0,24 48,10 48,32 0,32" className="cb-px" />
        <polygon points="0,24 48,10 48,11 0,25" className="cb-pxl" />

        <rect x="5" y="27" width="1" height="1" className="cb-pxl" />
        <rect x="18" y="22" width="1" height="1" className="cb-pxl" />
        <rect x="30" y="17" width="1" height="1" className="cb-pxl" />
        <rect x="42" y="12" width="1" height="1" className="cb-pxl" />

        <g className="cb-terrain">
          <rect x="10" y="25" width="1" height="1" className="cb-pxm" />
          <rect x="26" y="19" width="1" height="1" className="cb-pxm" />
          <rect x="38" y="13" width="1" height="1" className="cb-pxm" />
        </g>

      </svg>
    </div>
  );
}
