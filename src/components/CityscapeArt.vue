<template>
  <svg class="cityscape"
       viewBox="0 0 800 480"
       xmlns="http://www.w3.org/2000/svg"
       preserveAspectRatio="xMidYMid slice"
       role="img"
       aria-label="Neon sunset over a night city skyline">
    <defs>
      <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a1238" />
        <stop offset="58%" stop-color="#342052" />
        <stop offset="100%" stop-color="#ab436d" />
      </linearGradient>
      <linearGradient id="city-sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff2ae" />
        <stop offset="46%" stop-color="#ffab7a" />
        <stop offset="100%" stop-color="#ed4783" />
      </linearGradient>
      <linearGradient id="city-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#412551" />
        <stop offset="100%" stop-color="#0a1436" />
      </linearGradient>
      <pattern id="city-lit" width="17" height="22" patternUnits="userSpaceOnUse">
        <rect x="4" y="5" width="3" height="5" fill="#ffc577" opacity=".75" />
        <rect x="11" y="13" width="3" height="4" fill="#f4a4de" opacity=".56" />
      </pattern>
      <clipPath id="city-disc">
        <circle cx="408" cy="241" r="122" />
      </clipPath>
      <mask id="city-sun-stripes">
        <rect width="800" height="480" fill="white" />
        <path d="M275 247h265v5H275z M275 261h265v7H275z M275 277h265v8H275z M275 296h265v11H275z M275 319h265v16H275z M275 347h265v23H275z"
              fill="black" />
      </mask>
    </defs>

    <rect width="800" height="480" fill="url(#city-sky)" />
    <g fill="#f6d4fc" opacity=".9">
      <circle cx="52" cy="38" r="1.5" /><circle cx="138" cy="102" r="1.2" />
      <circle cx="224" cy="46" r="1.6" /><circle cx="313" cy="82" r="1" />
      <circle cx="492" cy="49" r="1.4" /><circle cx="610" cy="90" r="1.3" />
      <circle cx="743" cy="37" r="1.7" /><circle cx="715" cy="151" r="1" />
      <circle cx="81" cy="189" r="1" /><circle cx="563" cy="140" r="1.1" />
      <circle cx="656" cy="23" r="1.2" /><circle cx="341" cy="18" r="1" />
    </g>
    <circle cx="408" cy="241" r="140" fill="#ed5894" opacity=".12" />
    <g clip-path="url(#city-disc)" mask="url(#city-sun-stripes)">
      <rect x="270" y="112" width="276" height="260" fill="url(#city-sun)" />
    </g>
    <path d="M0 343l64-52 42 23 52-49 56 36 40-24 54 31 58-40 42 38 49-27 58 48 58-23 56 31 55-36 67 31v134H0z"
          fill="#5d2a60" opacity=".7" />
    <path d="M0 381h800v99H0z" fill="url(#city-water)" />

    <g fill="#141b42">
      <path d="M0 320h45v-52h28v-32h42v104h41v-77h52v-35h32v116h34v-51h38v57h44v-25h40v55H0z" />
      <path d="M440 340h29v-70h44v-34h25v103h38V222h41v-36h17v152h24v-75h42v46h34v-86h29v-24h26v181H440z" />
    </g>
    <g fill="url(#city-lit)" opacity=".84">
      <path d="M0 320h45v-52h28v-32h42v104h41v-77h52v-35h32v116h34v-51h38v57h44v-25h40v55H0z" />
      <path d="M440 340h29v-70h44v-34h25v103h38V222h41v-36h17v152h24v-75h42v46h34v-86h29v-24h26v181H440z" />
    </g>
    <path d="M0 381h800" stroke="#ff98b7" stroke-width="3" opacity=".75" />
    <g stroke="#f5a3ba" stroke-linecap="round" opacity=".55">
      <path d="M310 397h220 M338 408h190 M354 419h147 M375 430h115 M389 443h87 M400 456h69"
            stroke-width="3" />
      <path d="M16 419h165 M62 450h148 M567 407h208 M622 441h150 M560 469h95"
            stroke-width="1.4" />
    </g>
  </svg>
</template>

<script>
export default {
  name: 'CityscapeArt'
}
</script>
