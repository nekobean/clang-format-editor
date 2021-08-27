import "highlight.js/styles/xcode.css" // ここでデザインを変更

import App from "./App.vue"
import Vue from "vue"
import vuetify from "./plugins/vuetify"
import VueMeta from 'vue-meta'

Vue.use(VueMeta)

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount("#app")
