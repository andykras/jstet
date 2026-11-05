import Vue from 'vue'

// Vite equivalent of webpack's require.context: preserve the global component names.
const components = import.meta.glob('./**/*.vue', { eager: true })

Object.entries(components).forEach(([path, module]) => {
  const name = path.split('/').pop().replace(/\.vue$/, '')
  Vue.component(name, module.default || module)
})
