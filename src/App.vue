<template>
  <div id="app" :class="{dark: isDark}">
    <button class="left" @click="verbose = !verbose">Toggle Help</button>
    <button class="right" @click="isDark = !isDark">Dark Mode / Light Mode</button>
    <a class="right" href="https://github.com/zuckschwerdt/bitbench">Github comments and code welcome</a>
    <h1>Welcome to BitBench</h1>
    <p class="tagline">Visually dissect and analyze bit strings.</p>
    <BitBench :verbose="verbose"/>
  </div>
</template>

<script>
import BitBench from './components/BitBench.vue'

export default {
  name: 'app',
  components: {
    BitBench
  },
  data: function () {
    return {
      verbose: true,
      isDark: window.matchMedia
        && window.matchMedia('(prefers-color-scheme: dark)').matches
        || new Date().getHours() % 18 < 8 /* 18:00 to 8:00 is night time */
    }
  },
  created () {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      this.isDark = event.matches
    })
  },
}
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
