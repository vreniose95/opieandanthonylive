import './css/site.css';
import 'bootstrap';

import Vue from 'vue';
import VueRouter from 'vue-router';
import { sync } from 'vuex-router-sync';

import { store } from './store';

Vue.use(VueRouter);

const routes = [
  { path: '/', component: require('./components/home/home.vue.html').default },
  { path: '/counter', component: require('./components/counter/counter.vue.html').default },
  { path: '/fetchdata', component: require('./components/fetchdata/fetchdata.vue.html').default }
];

const router = new VueRouter({ mode: 'history', routes: routes });

const unasync = sync(store, router);

new Vue({
  el: '#app-root',
  store,
  router,
  render: h => h(require('./components/app/app.vue.html').default)
});
