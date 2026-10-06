/**
 * The swirl-C brand mark, shown in the Strapi admin menu.
 */
const PluginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" aria-hidden="true">
    <rect width="512" height="512" rx="96" fill="#8b45e6" />
    <defs>
      <mask id="crt-swirl">
        <rect width="512" height="512" fill="#fff" />
        <g stroke="#000" strokeWidth="18" strokeLinecap="round" fill="none">
          <path d="M 254 160 Q 226.3 105.9 159.1 67.4" />
          <path d="M 192.8 183.8 Q 136.8 160.1 60.6 173.8" />
          <path d="M 161.1 241.3 Q 103 259.2 53.5 318.7" />
          <path d="M 173.9 305.7 Q 140.9 356.8 141.2 434.2" />
          <path d="M 225.1 346.9 Q 232.6 407.2 282.6 466.3" />
          <path d="M 290.7 345.5 Q 335.3 386.9 411.6 400" />
        </g>
        <circle cx="272" cy="246" r="108" fill="#000" />
      </mask>
    </defs>
    <g mask="url(#crt-swirl)" fill="#fff">
      <circle cx="298.6" cy="124.8" r="80" />
      <circle cx="204.3" cy="128" r="80" />
      <circle cx="134.2" cy="191.2" r="80" />
      <circle cx="121" cy="284.7" r="80" />
      <circle cx="171" cy="364.7" r="80" />
      <circle cx="260.8" cy="393.9" r="80" />
      <circle cx="348.3" cy="358.6" r="80" />
    </g>
  </svg>
);

export { PluginIcon };
