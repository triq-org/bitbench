<template>
  <div id="app" :class="{dark: isDark}">
    <button class="left" @click="verbose = !verbose">Toggle Help</button>
    <button class="right" @click="isDark = !isDark">Dark Mode / Light Mode</button>
    <a class="right" href="https://github.com/zuckschwerdt/bitbench">Github comments and code welcome</a>
    <h1>Welcome to BitBench</h1>
    <span>Visually dissect and analyze bit strings.</span>
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
      isDark: new Date().getHours() % 18 < 8 // 18:00 to 8:00 is night time
    }
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
}
h1 {
  clear: both;
  margin: 0;
  padding: 0 0 .5em 0;
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
  color: #4b8;
}
#app.dark {
  color: #aaa;
  background: #333;
}
.dark h1 {
  color: #5af;
  background: rgba(255,255,255,0.05);
}
.dark a {
  color: #5af;
}
</style>
