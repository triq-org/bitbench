<template>
  <div id="app" :class="{dark: isDark}">
    <button class="left" @click="verbose = !verbose">Toggle Help</button>
    <button class="right" @click="isDark = !isDark">Dark Mode / Light Mode</button>
    <a class="right dense" href="https://github.com/zuckschwerdt/bitbench">Github comments and code welcome</a>
    <h1 :class="{ dense: !verbose }">Welcome to BitBench</h1>
    <p :class="{ dense: !verbose }" class="tagline">Visually dissect and analyze bit strings.</p>
    <BitBench :verbose="verbose"/>
  </div>
</template>

<script setup>
import BitBench from './components/BitBench.vue'

import { ref } from 'vue'

const verbose = ref(true)
const isDark = ref(
  window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
    || new Date().getHours() % 18 < 8 /* 18:00 to 8:00 is night time */
)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  isDark.value = event.matches
})
</script>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  padding: 0;
}
#app {
  min-height: 100vh;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background: #fff;
}
h1 {
  clear: both;
  margin: 0;
  padding: 0;
}
.tagline {
  margin: 0 0 .5em 0;
}
a.dense,
h1.dense,
.tagline.dense {
  display: inline-block;
  margin: 0;
  padding: 0 0.5em;
  font-size: 1em;
  line-height: 2;
}
.left {
  float: left;
  margin-right: 2em;
}
.right {
  float: right;
  margin-left: 2em;
}
a {
  color: #e43;
}
#app.dark {
  color: #aaa;
  background: #222;
}
.dark h1 {
  color: #9b4;
}
.dark a {
  color: #9b4;
}
</style>
