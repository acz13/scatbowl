import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import './assets/scss/app.scss'

import VueCompositionApi from '@vue/composition-api'
import VShowSlide from '@/plugins/v-show-slide'

Vue.use(VueCompositionApi)

VShowSlide.inserted =
Vue.use(VShowSlide, {
  customEasing: {
    swing: 'cubic-bezier(.02, .01, .47, 1)'
  }
})

Vue.config.productionTip = false
Vue.config.performance = true

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
