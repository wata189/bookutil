import { createApp } from 'vue';
import { Quasar } from 'quasar';
import quasarLang from 'quasar/lang/ja';
import router from '@/router';

// Import icon libraries
import '@quasar/extras/mdi-v7/mdi-v7.css';

// Import Quasar css
import 'quasar/src/css/index.sass';

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue';

const myApp = createApp(App);

myApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  lang: quasarLang,
});

myApp.use(router);

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app');
