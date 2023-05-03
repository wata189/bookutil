
const app = createApp({
  components: {
    'c-header': httpVueLoader('../static/components/c-header.vue')

  },
  data(){
    return {
      helloworld: 'hello vue!'
    }
  },

  computed: {
  },

  methods: {
  },

  created(){
  },

  delimiters: ['[[', ']]']
});
app.use(vuetify).mount(APP_ID);