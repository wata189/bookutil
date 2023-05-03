<template>
  <v-app-bar color="primary">
    <!-- TODO: ここにBookutilのファビコンと同じアイコン入れる-->
    <v-app-bar-title>{{ pageName }}</v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn icon><v-icon>mdi-view-list</v-icon></v-btn>
    <v-btn icon><v-icon>mdi-bank</v-icon></v-btn>
    <v-btn icon><v-icon>mdi-book-open-variant</v-icon></v-btn>
    <v-divider inset vertical></v-divider>
    <v-btn icon><v-icon>mdi-weather-night</v-icon></v-btn>
    <v-btn icon><v-icon>mdi-cog</v-icon></v-btn>
  </v-app-bar>
</template>

<script>
  module.exports = {
    props: [],

    data: function(){
      return {
      }
    },

    computed: {
    },

    methods: {
    },

    created(){
    },

    delimiters: ['[[', ']]'],
  }
</script>

<style scoped>
</style>