/* eslint-disable no-console */

import { register } from 'register-service-worker'

if (import.meta.env.PROD) {
  // A newly controlling worker does not replace the JavaScript already running
  // in an open PWA. Let the player reload after finishing the current game.
  let hadController = Boolean(navigator.serviceWorker?.controller)
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (hadController) window.dispatchEvent(new Event('jstet:update-available'))
    hadController = true
  })

  register(import.meta.env.BASE_URL + 'service-worker.js', {
    ready() {
      console.log(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered() {
      console.log('Service worker has been registered.')
    },
    cached() {
      console.log('Content has been cached for offline use.')
    },
    updatefound() {
      console.log('New content is downloading.')
    },
    updated() {
      console.log('New content is available; please refresh.')
      window.dispatchEvent(new Event('jstet:update-available'))
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
