// vue関連の読み込み
const { createApp } = Vue
const { createVuetify } = Vuetify;
const vuetify = createVuetify({
  theme:{
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#2196F3',
          accent: '#2962FF',
          secondary: '#90A4AE',
          info: '#64FFDA',
          warning: '#FFC107',
          error: '#F44336',
          success: '#4CAF50'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          accent: '#2962FF',
          secondary: '#90A4AE',
          info: '#64FFDA',
          warning: '#FFC107',
          error: '#F44336',
          success: '#4CAF50'
        }
      }
    }
  }

});

const APP_ID = "#app";