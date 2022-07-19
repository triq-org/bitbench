<template>
  <div class="box" :class="{'error': codeBits.error}">
    <button v-on:click="padLeft -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padLeft }" v-model.number="padLeft">
    <button v-on:click="padLeft += 1"><span>&gt;&gt;</span></button>

    <button v-on:click="invert = !invert" :class="{'active': invert}"><span>~</span></button>

    <div class="bit-rows">
      <div class="bits" v-for="bits in bitsText" :key="bits" v-html="bits"/>
    </div>

    <button v-on:click="padRight -= 1"><span>&lt;&lt;</span></button>
    <input type="number" :class="{ active: !!padRight }" v-model.number="padRight">
    <button v-on:click="padRight += 1"><span>&gt;&gt;</span></button>

    <span class="calc" v-if="calcFunc && calcShow" v-html="calcText"/>

    <span class="comments" v-if="comments" v-html="commentText"/>
  </div>
</template>

<script setup>
import BitString from '../bitstring.js'

import { ref, computed } from 'vue'

const props = defineProps({
  code: String,
  bits: Object,
  fmts: String,
  calcFunc: String,
  calcOffset: Number,
  calcLength: Number,
  calcWidth: Number,
  calcShow: Number,
  comments: Boolean,
})

const padLeft = ref(0)
const padRight = ref(0)
const invert = ref(false)

const codeBits = computed(() =>
  props.bits ? props.bits : new BitString(props.code)
)

const bitsText = computed(() =>
  props.fmts
    .split('\n')
    .map((fmt) =>
      codeBits.value
      .copy()
      .invert(invert.value)
      .padLeft(padLeft.value)
      .padRight(padRight.value)
      .toFormat(fmt)
    )
)

const calcText = computed(() => {
  var result = 0
  if (props.calcFunc == 'ADD')
    result = codeBits.value.sumAdd(props.calcOffset, props.calcLength, props.calcWidth)
  else if (props.calcFunc == 'XOR')
    result = codeBits.value.sumXor(props.calcOffset, props.calcLength, props.calcWidth)
  return '= ' + result.toString(props.calcShow)
})

const commentText = computed(() =>
  (codeBits.value).comments
)

</script>
