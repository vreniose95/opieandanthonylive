import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({
  components: {
    'navbar': require('../navbar/navbar.vue.html').default
  }
})
export default class AppComponent extends Vue {
}
