import mitt from 'mitt'

// The game engine uses its own bus instead of Vue component-instance events.
export const gameBus = mitt()
