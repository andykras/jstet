// An explicit, URL-gated visual preview. Never published to D1 or mistaken for live results.
export const leaderboardPreviewEnabled = import.meta.env?.VITE_LEADERBOARD_PREVIEW === '1' &&
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('leaderboardPreview') === '1'

const nicknames = Object.freeze([
  'NEONFOX', 'PIXEL_7', 'NOVA', 'SPECTRUM', 'GHOST_77', 'ARCADE_KID',
  'ECHO', 'CYBERKITTEN_2049', 'ORBIT', 'PRISM_42', 'GLITCH', 'SKYLINE'
])

const scores = Object.freeze({
  tetcolor: {
    week: [28450, 22180, 19900, 17440, 15200, 13870, 11990, 10800, 9700, 8200, 6100, 4300],
    all: [94250, 82080, 79100, 65040, 57200, 50330, 47650, 41120, 39300, 32150, 27000, 20300]
  },
  classic: {
    week: [76400, 69150, 55000, 41800, 37000, 33100, 29400, 26000, 21550, 18200, 15800, 12000],
    all: [201400, 185050, 160200, 131600, 119000, 103300, 92500, 84100, 77500, 66900, 58000, 49500]
  }
})

export const leaderboardPreviewEntries = (mode, period) => {
  const values = scores[mode]?.[period] || []
  return values.map((score, index) => ({
    playerId: 'demo-' + index,
    nickname: nicknames[index],
    rank: index + 1,
    score
  }))
}
