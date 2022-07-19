<template>
  <div>
  <section class="bench">
    <p v-if="verbose">
      Enter hex code lines to analyze.
      Prefix 0<b>y</b> for <b>dual</b>,
      0<b>z</b> for <b>decimal</b>,
      0<b>x</b> for <b>hex</b>,
      0<b>o</b> for <b>octal</b>,
      0<b>t</b> for <b>ternary</b> (0,1,Z,X).<br/>
      Specify a bit length with <b>{</b>…<b>}</b> prefix (pad/truncate right, left for decimal),
      text in <b>[</b>…<b>]</b> brackets is ignored as comment.
    </p>
    <textarea class="codes" v-model="codes" @keyup="textareaSelect" @mouseup="textareaSelect" placeholder="add lines of hex, [comments], y z x o t to switch base"></textarea>
  </section>

  <section class="bench">
    <p>
      Align
      <input type="text" v-model="match">
      <button @click="toggleAlign(false)" :class="{'active': align==false}"><span>None</span></button>
      <button @click="toggleAlign('Preamble')" :class="{'active': align=='Preamble'}"><span>Preamble</span></button>
      <button @click="toggleAlign('Sync')" :class="{'active': align=='Sync'}"><span>Sync</span></button>
      <span class="v-space"></span>
      <button @click="showAlign = !showAlign" :class="{'active': showAlign}"><span>Show</span></button>
      <span class="v-space"></span>
      Comments
      <button @click="comments = !comments" :class="{'active': comments}"><span>C</span></button>
    </p>
    <div v-if="align && showAlign" class="code-lines">
      <BitBox v-for="(code, index) in codesWithAlign" :key="code.index"
        :class="{'cursor': index === cursor, 'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :bits="code.bits" fmts="8h " :comments="comments"/>
    </div>
  </section>


  <section class="bench">
    <p>
      Shift
      <button @click="shift -= 1"><span>&lt;&lt;</span></button>
      <input type="number" v-model.number="shift">
      <button @click="shift += 1"><span>&gt;&gt;</span></button>
      <span class="v-space"></span>
      Invert
      <button @click="invert = !invert" :class="{'active': invert}"><span>~</span></button>
      <span class="v-space"></span>
      Xor
      <input type="text" size="4" v-model="xor">
      <span class="v-space"></span>
      Reflect
      <button @click="reflect = !reflect" :class="{'active': reflect}"><span>^</span></button>
      <span class="v-space"></span>
      <button @click="showShift = !showShift" :class="{'active': showShift}"><span>Show</span></button>
    </p>
    <div v-if="showShift" class="code-lines">
      <BitBox v-for="(code, index) in codesWithShiftInvert" :key="code.index"
        :class="{'cursor': index === cursor, 'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :bits="code.bits" fmts="8h " :comments="comments"/>
    </div>
  </section>

  <section class="bench">
    <p>
      Coding
      <button @click="toggleCoding(false)" :class="{'active': coding==false}"><span>None</span></button>
      <button @click="toggleCoding('MC')" :class="{'active': coding=='MC'}"><span>Manchester (G.E. Thomas)</span></button>
      <button @click="toggleCoding('MCI')" :class="{'active': coding=='MCI'}"><span>Manchester (IEEE 802.3)</span></button>
      <button @click="toggleCoding('DMC')" :class="{'active': coding=='DMC'}"><span>Differential Manchester</span></button>
      <span class="v-space"></span>
      Xor
      <input type="text" size="4" v-model="xor2">
      <span class="v-space"></span>
      <button @click="showCoding = !showCoding" :class="{'active': showCoding}"><span>Show</span></button>
    </p>
    <div v-if="coding && showCoding" class="code-lines">
      <BitBox v-for="(code, index) in codesWithCoding" :key="code.index"
        :class="{'cursor': index === cursor, 'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :bits="code.bits" fmts="8h " :comments="comments"/>
    </div>
  </section>

  <section class="bench">
    <p>
      Calculation
      <button @click="toggleCalcFunc('')" :class="{'active': calcFunc==''}"><span>None</span></button>
      <button @click="toggleCalcFunc('ADD')" :class="{'active': calcFunc=='ADD'}"><span>ADD</span></button>
      <button @click="toggleCalcFunc('XOR')" :class="{'active': calcFunc=='XOR'}"><span>XOR</span></button>

      <span class="v-space"></span>
      Offset
      <button @click="calcOffset -= 1"><span>&lt;</span></button>
      <input type="number" v-model.number="calcOffset">
      <button @click="calcOffset += 1"><span>&gt;</span></button>

      Length
      <button @click="calcLength -= 1"><span>&lt;</span></button>
      <input type="number" v-model.number="calcLength">
      <button @click="calcLength += 1"><span>&gt;</span></button>

      Width
      <button @click="calcWidth -= 1"><span>&lt;</span></button>
      <input type="number" v-model.number="calcWidth">
      <button @click="calcWidth += 1"><span>&gt;</span></button>

      <span class="v-space"></span>
      Show
      <button @click="toggleCalcShow(16)" :class="{'active': calcShow==16}"><span>Hex</span></button>
      <button @click="toggleCalcShow(10)" :class="{'active': calcShow==10}"><span>Dec</span></button>
      <button @click="toggleCalcShow(2)"  :class="{'active': calcShow==2}"><span>Bin</span></button>
    </p>
  </section>

  <section class="bench">
    <p v-if="verbose">
      Enter format string (each line is one decode).
      <b>h</b> hex (4 bits)
      <b>b</b> binary (1 bit)
      <b>d</b> decimal (8 bits)
      <b>c</b> ascii character (8 bits)
      <b>x</b> skip (1 bit)
      <br>
      Use optional bit length prefix numbers.
      Use "<b>~</b>" to invert bits, use "<b>^</b>" to reverse LSB/MSB, use "<b>&gt;</b>" and "<b>&lt;</b>" to<br/>
      interpret multi-byte values as big-endian (default) or little-endian.
      Other characters are output as-is.
      <a href="#" @click.prevent="helpFormat = !helpFormat">Help</a>,
      <a href="#" @click.prevent="helpExamples = !helpExamples">Examples</a>.
    </p>
    <p v-if="helpFormat">
      <ul>
        <li>"<b>h</b>" for hex (default 4 bits)</li>
        <li>"<b>b</b>" for binary (default 1 bit)</li>
        <li>"<b>d</b>" for decimal (default 8 bits)</li>
        <li>"<b>c</b>" for ascii character (default 8 bits)</li>
        <li>"<b>x</b>" for don&apos;t care / don&apos;t output (default 1 bit)</li>
      </ul>
    </p>
    <ul v-if="helpExamples">
      <li>E.g. <a @click="setFormat('hh ')">"hh "</a> or <a @click="setFormat('8h ')">"8h "</a> for byte-grouped hex output.</li>
      <li><a @click="setFormat('hhhh ')">"hhhh "</a> or <a @click="setFormat('16h ')">"16h "</a> for word-grouped hex output.</li>
      <li><a @click="setFormat('b')">"b"</a> for ungrouped binary output.</li>
      <li><a @click="setFormat('4b 4b | ')">"4b 4b | "</a> for nibble and byte-grouped binary output.</li>
      <li><a @click="setFormat('8b \n..... 8h \n.... 8d ')">"8b \n 8h \n 8d "</a> for bit, hex, and dec outputs.</li>
      <li><a @click="setFormat('hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h ')">"hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h "</a> e.g. for the example data.</li>
    </ul>
    <textarea class="fmts" v-model="fmts" placeholder="enter format lines"></textarea>
    <div>
      <a :href="url" @click.prevent="copyUrl">Link to this data and format</a>
      <input class="vanish" :value="url"/> (Click copies to clipboard)
    </div>
  </section>

  <section class="bench">
    <div class="code-lines">
      <BitBox v-for="(code, index) in codesWithCoding" :key="code.index"
        :class="{'cursor': index === cursor, 'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :bits="code.bits" :fmts="fmts" :comments="comments"
        :calcFunc="calcFunc" :calcOffset="calcOffset" :calcLength="calcLength" :calcWidth="calcWidth" :calcShow="calcShow"
      />
    </div>
  </section>
  </div>
</template>

<script setup>
import BitString from '../bitstring'
import BitBox from './BitBox.vue'

import { ref, computed } from 'vue'

defineProps({
  verbose: Boolean,
})

const codes = ref(`30 c3 81 d5 5c 2a cf 08 35 44 2c
30 35 c2 2f 3c 0f a1 07 52 29 9f
30 35 c2 2e 3c fb 8c 07 52 29 9f
30 c9 a2 1e 40 0c 05 07 34 c6 b1
30 2b b2 14 3d 94 f2 08 53 78 e6
30 c9 a2 1f 40 f8 f2 07 34 c6 b1
30 44 92 13 3e 0e 65 07 45 04 5f
30 44 92 15 3d 07 5f 07 45 04 5f
30 c3 81 d6 5b 90 35 08 35 44 2c`)
const align = ref(false)
const match = ref('')
const showAlign = ref(false)
const shift = ref(0)
const invert = ref(false)
const xor = ref('')
const reflect = ref(false)
const showShift = ref(false)
const coding = ref(false)
const xor2 = ref('')
const showCoding = ref(false)
const calcFunc = ref('')
const calcOffset = ref(0)
const calcLength = ref(0)
const calcWidth = ref(4)
const calcShow = ref(16)
const fmts = ref('hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h ')
const comments = ref(true)
const cursor = ref(-1)
const helpFormat = ref(false)
const helpExamples = ref(false)

let uri = window.location.search.substring(1) || window.location.hash.substring(1)
let params = new URLSearchParams(uri);
let paramCodes = params.getAll('c').join('\n')
let paramFmt = params.get('f')
let paramAlign = params.get('a')
let paramMatch = params.get('m')
let paramShift = params.get('s')
let paramInvert = params.get('i')
let paramXor = params.get('x')
let paramReflect = params.get('r')
let paramCoding = params.get('d')
let paramXor2 = params.get('x2')
let paramCalcFunc = params.get('cf')
let paramCalcOffset = params.get('co')
let paramCalcLength = params.get('cl')
let paramCalcWidth = params.get('cw')
if (paramCodes)
  codes.value = paramCodes
if (paramFmt)
  fmts.value = paramFmt
if (paramAlign)
  align.value = paramAlign
if (paramMatch)
  match.value = paramMatch
if (paramShift)
  shift.value = parseInt(paramShift, 10)
if (paramInvert)
  invert.value = paramInvert
if (paramXor)
  xor.value = paramXor
if (paramReflect)
  reflect.value = paramReflect
if (paramCoding)
  coding.value = paramCoding
if (paramXor2)
  xor2.value = paramXor2
if (paramCalcFunc)
  calcFunc.value = paramCalcFunc
if (paramCalcOffset)
  calcOffset.value = parseInt(paramCalcOffset, 10)
if (paramCalcLength)
  calcLength.value = parseInt(paramCalcLength, 10)
if (paramCalcWidth)
  calcWidth.value = parseInt(paramCalcWidth, 10)

const codeLines = computed(() =>
  codes.value.trim().split('\n')
    .map((el, index) => { return {index: index, bits: new BitString(el) } })
)

const codesWithAlign = computed(() => {
  const codes = codeLines.value
  let matchBits = new BitString(match.value)
  if (align.value == 'Preamble') {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().matchPreamble(matchBits) } })
  } else if (align.value == 'Sync') {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().matchSync(matchBits)} })
  } else {
    return codes
  }
})

const codesWithShiftInvert = computed(() => {
  const codes = codesWithAlign.value
  return codes
    .map((el, index) => { return {index: index, bits: el.bits.copy()
      .shiftRight(shift.value)
      .invert(invert.value)
      .xor(xor.value)
      .reflect(reflect.value)
    } })
})

const codesWithCoding = computed(() => {
  const codes = codesWithShiftInvert.value
  if (coding.value == 'MC') {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().decodeMC().xor(xor2.value)} })
  } else if (coding.value == 'MCI') {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().decodeMCI().xor(xor2.value)} })
  } else if (coding.value == 'DMC') {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().decodeDMC().xor(xor2.value)} })
  } else {
    return codes
      .map((el, index) => { return {index: index, bits: el.bits.copy().xor(xor2.value)} })
  }
})

const url = computed(() => {
  const u = new URL(window.location)
  u.hash = '#' +
    codes.value.trim().split('\n')
      .map((el) => 'c=' + encodeURIComponent(el) )
      .join('&') +
    '&f=' + encodeURIComponent(fmts.value) +
    (align.value ? '&a=' + encodeURIComponent(align.value) : '') +
    (align.value ? '&m=' + encodeURIComponent(match.value) : '') +
    (shift.value ? '&s=' + encodeURIComponent(shift.value) : '') +
    (invert.value ? '&i=' + encodeURIComponent(invert.value) : '') +
    (xor.value ? '&x=' + encodeURIComponent(xor.value) : '') +
    (reflect.value ? '&r=' + encodeURIComponent(reflect.value) : '') +
    (coding.value ? '&d=' + encodeURIComponent(coding.value) : '') +
    (xor2.value ? '&x2=' + encodeURIComponent(xor2.value) : '') +
    (calcFunc.value ? '&cf=' + encodeURIComponent(calcFunc.value) : '') +
    (calcOffset.value ? '&co=' + encodeURIComponent(calcOffset.value) : '') +
    (calcLength.value ? '&cl=' + encodeURIComponent(calcLength.value) : '') +
    (calcWidth.value ? '&cw=' + encodeURIComponent(calcWidth.value) : '')
  return u.href
})

function textareaSelect(event) {
  const textarea = event.target
  cursor.value = textarea.value.substr(0, textarea.selectionStart).split('\n').length - 1
}
function toggleAlign(newAlign) {
  align.value = align.value == newAlign ? false : newAlign;
}
function toggleCoding(newCoding) {
  coding.value = coding.value == newCoding ? false : newCoding;
}
function toggleCalcFunc(newCalcFunc) {
  calcFunc.value = calcFunc.value == newCalcFunc ? '' : newCalcFunc;
}
function toggleCalcShow(newCalcShow) {
  calcShow.value = calcShow.value == newCalcShow ? 0 : newCalcShow;
}
function setFormat(newFmt) {
  fmts.value = newFmt
}
function copyUrl(event) {
  const copyEl = event.target.nextSibling
  copyEl.focus()
  copyEl.select()
  try {
    document.execCommand('copy');
  } catch (err) {
    // ignore
  }
}

</script>

<style>
.bench {
  display: flex;
  flex-flow: column;
  align-items: center;
  border-top: 1px solid #f0f0f0;
}
.dark .bench {
  background: rgba(255,255,255,0.1);
  border-top: 1px solid #222;
}
.bench > div, .bench > p, .bench ul {
 text-align: left;
}
textarea, input, .bits {
  font-family: monospace;
  font-size: 15px;
}
textarea {
  width: 100%;
  height: 250px;
  border: none;
  border-bottom: 1px solid #DDD;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px rgba(255,255,255,0.5), 0 1px 0 rgba(255,255,255,0.5);
  padding: 1em 2em;
  color: #44f;
}
.dark textarea {
  border-bottom: none;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2), 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0 rgba(0,0,0,0.5);
}

input.perfect-inset {
  height: 34px;
  width: 100%;
  border-radius: 3px;
  border: 1px solid transparent;
  border-top: none;
  border-bottom: 1px solid #DDD;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px #FFF, 0 1px 0 #FFF;
}

textarea.codes {
  height: 250px;
}
textarea.fmts {
  height: 100px;
}
.dark textarea, .dark input[type=text] {
  border: none;
  color: #9b4;
  background: #222;
}
.dark button {
  color: #aaa;
  background: #444;
}
.v-space {
  display: inline-block;
  min-width: 2em;
}
button {
  min-width: 2.5em;
  padding: 7px 12px;
  color: #333;
  background: #ddd;
  border: none;
}
button.small,
.box button {
  padding: 4px 12px;
}
button.active {
  color: #444;
  background: #9d0;
}
button:hover, button:active {
  color: #444;
  background: #e43;
}
.dark button.active {
  background: #9b4;
}
.dark button:hover, .dark button:active {
  background: #e43;
}
.bench .code-lines {
  width: 100%;
}
.box {
  background: rgba(0,0,0,0.05);
}
.box.even {
  background: rgba(0,0,0,0.1);
}
.box.error {
  background: rgba(255,0,0,0.05);
}
.box.error.even {
  background: rgba(255,0,0,0.1);
}
.box.cursor {
  background: rgba(153,255,153,0.2);
}
.box button, .box input {
    visibility: hidden;
}
.box:hover button, .box:hover input,
.box:active button, .box:active input,
.box button.active, .box input.active {
    visibility: visible;
}
input {
  padding: 5px 0.5em;
  border: none;
  border-top: 1px solid transparent;
  border-bottom: 1px solid #DDD;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.39), 0 -1px 1px rgba(255,255,255,0.5), 0 1px 0 rgba(255,255,255,0.5);
  text-align: center;
}
input.small,
.box input {
  padding: 2px 0.5em;
}
.dark input {
  border-bottom: none;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2), 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0 rgba(0,0,0,0.2);
  color: #9b4;
}
input[type=text] {
  color: #44f;
  background: rgba(0,0,0,0.1);
}
input[type=number] {
  max-width: 3.5em;
  background: rgba(0,0,0,0.05);
}
input.vanish {
  width: 1px;
  transform: translate(-100vw);
  padding: 0;
}
.bit-rows {
  display: inline-block;
}
.bits {
  color:#aaa;
  letter-spacing: 1px;
}
.bits span, .bits b, .bits i {
  padding: 1px 0;
  border-radius: 2px;
}
.bits i {
  color:#977;
  background: #ffdd;
}
.bits b {
  color:#0a0;
  background: #cfc;
}
.bits .hex {
  color: #444;
  background: #fcf;
}
.bits .dec {
  color: #444;
  background: #cff;
}
.bits .chr {
  color: #444;
  background: #8cf;
}
.bits .chr .ctrl {
  background: #f88;
}
.bits .chr .inv {
  color: #fff;
}
.comments {
  margin-left: 1em;
}
/* heat map */
.bits em {
  color:transparent;
}
.bits .h0  { color: #3500FF; }
.bits .h1  { color: #4700FF; }
.bits .h2  { color: #5800FF; }
.bits .h3  { color: #6A00FF; }
.bits .h4  { color: #7C00FF; }
.bits .h5  { color: #8D00FF; }
.bits .h6  { color: #9F00FF; }
.bits .h7  { color: #B000FF; }
.bits .h8  { color: #C200FF; }
.bits .h9  { color: #D400FF; }
.bits .h10 { color: #E500FF; }
.bits .h11 { color: #F700FF; }
.bits .h12 { color: #FF00F6; }
.bits .h13 { color: #FF00E4; }
.bits .h14 { color: #FF00D3; }
.bits .h15 { color: #FF00C1; }
.bits .h16 { color: #FF00AF; }
.bits .h17 { color: #FF009E; }
.bits .h18 { color: #FF008C; }
.bits .h19 { color: #FF007B; }
.bits .h20 { color: #FF0069; }
.bits .h21 { color: #FF0057; }
.bits .h22 { color: #FF0046; }
.bits .h23 { color: #FF0034; }
.bits .h24 { color: #FF0023; }
</style>
