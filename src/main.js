import { createApp } from 'vue'
import App from '@/App.vue'
import store from '@/store'
import { registerComponents } from '@/components/registration'
import '@/registerServiceWorker'

const app = createApp(App)
app.use(store)
registerComponents(app)
app.mount('#app')
