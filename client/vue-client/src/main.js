import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import './assets/scss/app.scss'

import Field from 'buefy/dist/components/field'
import Slider from 'buefy/dist/components/slider'

Vue.use(Field)
Vue.use(Slider)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
