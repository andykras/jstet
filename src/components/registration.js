import Vue from 'vue'

const requireComponent = require.context('.', false, /[\w-]+\.vue$/)

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)

  // strip extension from the filename
  const componentName = fileName.replace(/^\.\/(.*)\.\w+$/, '$1')

  // register component globally
  Vue.component(componentName, componentConfig.default || componentConfig)
})
