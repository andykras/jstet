// Preserve the existing global component names without using removed Vue 2 APIs.
const components = import.meta.glob('./**/*.vue', { eager: true })

export function registerComponents(app) {
  Object.entries(components).forEach(([path, module]) => {
    const name = path.split('/').pop().replace(/\.vue$/, '')
    app.component(name, module.default || module)
  })
}
