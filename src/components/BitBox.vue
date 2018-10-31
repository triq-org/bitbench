<template>
  <div class="box">
    <button v-on:click="padLeft -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padLeft }" v-model="padLeft">
    <button v-on:click="padLeft += 1"><span>&gt;&gt;</span></button>

    <button v-on:click="padRight -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padRight }" v-model="padRight">
    <button v-on:click="padRight += 1"><span>&gt;&gt;</span></button>

    <button v-on:click="localInvert = !localInvert" :class="{'active': localInvert}"><span>~</span></button>

    <span class="bits" v-html="bitsText"></span>
  </div>
</template>

<script>
import BitString from '../bitstring'

export default {
  name: 'BitBox',
  props: {
    code: String,
    fmt: String,
    shift: Number,
    invert: Boolean,
  },
  data: function () {
    return {
      padLeft: 0,
      padRight: 0,
      localInvert: false,
    }
  },
  computed: {
    bitsText: function () {
      return new BitString(this.code)
      .invert(this.invert)
      .invert(this.localInvert)
      .shiftRight(this.shift)
      .padLeft(this.padLeft)
      .padRight(this.padRight)
      .toFormat(this.fmt)
    },
  },
}
</script>
