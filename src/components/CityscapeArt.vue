<template>
  <svg class="cityscape"
       viewBox="0 0 320 800"
       xmlns="http://www.w3.org/2000/svg"
       preserveAspectRatio="xMidYMid slice"
       role="img"
       aria-label="Striped sunset, luminous towers and reflections over a neon night city">
    <defs>
      <linearGradient id="city-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090b27" />
        <stop offset="48%" stop-color="#260e48" />
        <stop offset="77%" stop-color="#d02d83" />
        <stop offset="100%" stop-color="#251041" />
      </linearGradient>
      <radialGradient id="city-halo">
        <stop offset="0%" stop-color="#ffb46d" stop-opacity=".44" />
        <stop offset="68%" stop-color="#f251ac" stop-opacity=".23" />
        <stop offset="100%" stop-color="#e952a4" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="city-sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff6b5" />
        <stop offset="35%" stop-color="#ffcb55" />
        <stop offset="72%" stop-color="#ff7e67" />
        <stop offset="100%" stop-color="#ff368a" />
      </linearGradient>
      <linearGradient id="city-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#57216a" />
        <stop offset="55%" stop-color="#260f56" />
        <stop offset="100%" stop-color="#0a0c30" />
      </linearGradient>
      <pattern id="city-windows" width="13" height="15" patternUnits="userSpaceOnUse">
        <rect x="3" y="3" width="3" height="5" fill="#ffca7d" opacity=".92" />
        <rect x="9" y="10" width="2" height="3" fill="#ef65c6" opacity=".66" />
      </pattern>
      <mask id="city-striped-disc">
        <rect width="320" height="800" fill="white" />
        <g fill="black">
          <rect x="40" y="443" width="240" height="4" />
          <rect x="40" y="454" width="240" height="5" />
          <rect x="40" y="469" width="240" height="7" />
          <rect x="40" y="488" width="240" height="8" />
          <rect x="40" y="510" width="240" height="11" />
          <rect x="40" y="537" width="240" height="14" />
        </g>
      </mask>
    </defs>

    <rect width="320" height="800" fill="url(#city-night)" />
    <g fill="#fff3fc">
      <circle v-for="(star, index) in stars"
              :key="index"
              :cx="star[0]"
              :cy="star[1]"
              :r="star[2]"
              :opacity="star[3]" />
    </g>
    <path d="M0 273l49 12 22-20 37 11 36-21 40 19 37-13 36 21 63-15v109H0z"
          fill="#6f1c70"
          opacity=".25" />
    <ellipse cx="160" cy="435" rx="155" ry="184" fill="url(#city-halo)" />
    <circle cx="160" cy="441" r="104" fill="url(#city-sunset)" mask="url(#city-striped-disc)" />
    <path d="M0 424l32-20 40 10 33-22 34 17 40-9 39 17 45-19 57 23"
          fill="none"
          stroke="#f462b4"
          stroke-width="2"
          opacity=".48" />
    <path d="M0 463l43-18 31 8 33-16 42 9 36-10 35 17 47-8 53 14"
          fill="none"
          stroke="#ec57a7"
          stroke-width="2"
          opacity=".64" />

    <path d="M0 594l32-45 25 11 23-36 26 22 27-35 36 42 22-22 27 26 27-31 29 32 28-16 18 26v80H0z"
          fill="#a12778"
          opacity=".44" />
    <g>
      <rect v-for="(building, index) in backBuildings"
            :key="'b' + index"
            :x="building[0]"
            :y="building[1]"
            :width="building[2]"
            :height="682 - building[1]"
            fill="#411348" />
    </g>
    <g>
      <g v-for="(building, index) in frontBuildings"
         :key="'f' + index">
        <rect :x="building[0]"
              :y="building[1]"
              :width="building[2]"
              :height="682 - building[1]"
              fill="#100e35" />
        <rect :x="building[0]"
              :y="building[1] + 9"
              :width="building[2]"
              :height="673 - building[1]"
              fill="url(#city-windows)" />
      </g>
    </g>
    <path d="M73 682V536m-4 0h8M163 682V487m-5 0h10M274 682V556m-4 0h8"
          stroke="#e367ba"
          stroke-width="1.5"
          opacity=".8" />
    <path d="M0 682h320" stroke="#ff90c7" stroke-width="3" />
    <rect y="684" width="320" height="116" fill="url(#city-water)" />
    <g stroke-linecap="round" fill="none">
      <path d="M99 690h119M114 697h93M92 704h137M117 711h86M81 719h156M106 730h106M92 740h139M118 751h86M131 762h57M135 776h48"
            stroke="#ffac72"
            stroke-width="3.5"
            opacity=".78" />
      <path d="M0 699h72M248 695h72M0 717h103M233 726h87M0 754h97M253 766h67M0 787h128M222 790h98"
            stroke="#e74ba8"
            stroke-width="1.7"
            opacity=".56" />
    </g>
  </svg>
</template>

<script>
export default {
  name: 'CityscapeArt',
  data() {
    return {
      stars: [
        [17, 22, 1.2, 0.8], [64, 43, 1.1, 0.7], [113, 12, 1.6, 0.9],
        [184, 45, 0.8, 0.6], [260, 22, 1.4, 0.9], [305, 69, 1.0, 0.7],
        [34, 97, 1.0, 0.6], [86, 126, 1.2, 0.8], [150, 92, 0.9, 0.8],
        [229, 125, 1.6, 0.7], [288, 152, 1.0, 0.7], [9, 174, 1.3, 0.9],
        [62, 213, 1.0, 0.5], [121, 190, 1.3, 0.8], [211, 223, 0.9, 0.8],
        [271, 202, 1.1, 0.7], [301, 259, 1.3, 0.7], [23, 274, 1.0, 0.6]
      ],
      backBuildings: [
        [0, 575, 22], [18, 555, 21], [41, 529, 20], [65, 560, 25],
        [90, 542, 23], [113, 569, 23], [139, 525, 23], [167, 552, 29],
        [201, 530, 21], [230, 558, 23], [258, 541, 24], [285, 572, 35]
      ],
      frontBuildings: [
        [0, 629, 24], [24, 599, 33], [59, 637, 21], [82, 570, 30],
        [115, 618, 26], [143, 550, 25], [173, 616, 30], [204, 578, 29],
        [237, 633, 21], [258, 592, 29], [291, 619, 29]
      ]
    }
  }
}
</script>
