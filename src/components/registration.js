import Vue from 'vue'

const requireComponent = require.context('.', true, /[\w-]+\.vue$/)
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)

  // strip name: "./folder/component.vue" -> "component"
  const componentName = fileName.replace(/.*\/([\w-]+)\.\w+/, '$1')

  // register component globally
  Vue.component(componentName, componentConfig.default || componentConfig)
})
console.log('registration-of-global-components completed.')
