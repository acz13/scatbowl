import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import './assets/scss/app.scss'

import Button from 'buefy/dist/components/button'
import Collapse from 'buefy/dist/components/collapse'
import Field from 'buefy/dist/components/field'
import Slider from 'buefy/dist/components/slider'

Vue.use(Button)
Vue.use(Collapse)
Vue.use(Field)
Vue.use(Slider)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
