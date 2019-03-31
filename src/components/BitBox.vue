<template>
  <div class="box" :class="{'error': codeBits.error}">
    <button v-on:click="padLeft -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padLeft }" v-model="padLeft">
    <button v-on:click="padLeft += 1"><span>&gt;&gt;</span></button>

    <button v-on:click="invert = !invert" :class="{'active': invert}"><span>~</span></button>

    <div class="bit-rows">
      <div class="bits" v-for="bits in bitsText" :key="bits" v-html="bits"/>
    </div>

    <button v-on:click="padRight -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padRight }" v-model="padRight">
    <button v-on:click="padRight += 1"><span>&gt;&gt;</span></button>

    <span class="comments" v-if="comments" v-html="commentText"/>
  </div>
</template>

<script>
import BitString from '../bitstring'

export default {
  name: 'BitBox',
  props: {
    code: String,
    bits: Object,
    fmts: String,
    comments: Boolean,
  },
  data: function () {
    return {
      padLeft: 0,
      padRight: 0,
      invert: false,
    }
  },
  computed: {
    codeBits: function () {
      return this.bits ? this.bits : new BitString(this.code)
    },
    bitsText: function () {
      return this.fmts
        .split('\n')
        .map((fmt) =>
          this.codeBits
          .invert(this.invert)
          .padLeft(this.padLeft)
          .padRight(this.padRight)
          .toFormat(fmt)
        )
    },
    commentText: function () {
      return (this.codeBits).comments
    },
  },
}
</script>
