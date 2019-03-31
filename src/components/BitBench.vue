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
      <input type="number" v-model="shift">
      <button @click="shift += 1"><span>&gt;&gt;</span></button>
      <span class="v-space"></span>
      Invert
      <button @click="invert = !invert" :class="{'active': invert}"><span>~</span></button>
      <span class="v-space"></span>
      <button @click="showShift = !showShift" :class="{'active': showShift}"><span>Show</span></button>
    </p>
    <div v-if="align && showShift" class="code-lines">
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
      <button @click="showCoding = !showCoding" :class="{'active': showCoding}"><span>Show</span></button>
    </p>
    <div v-if="coding && showCoding" class="code-lines">
      <BitBox v-for="(code, index) in codesWithCoding" :key="code.index"
        :class="{'cursor': index === cursor, 'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :bits="code.bits" fmts="8h " :comments="comments"/>
    </div>
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
        :bits="code.bits" :fmts="fmts" :comments="comments"/>
    </div>
  </section>
  </div>
</template>

<script>
import BitString from '../bitstring'
import BitBox from './BitBox.vue'

export default {
  name: 'BitBench',
  components: {
    BitBox
  },
  props: {
    verbose: Boolean,
  },
  data: function () {
    return {
      codes: `30 c3 81 d5 5c 2a cf 08 35 44 2c
30 35 c2 2f 3c 0f a1 07 52 29 9f
30 35 c2 2e 3c fb 8c 07 52 29 9f
30 c9 a2 1e 40 0c 05 07 34 c6 b1
30 2b b2 14 3d 94 f2 08 53 78 e6
30 c9 a2 1f 40 f8 f2 07 34 c6 b1
30 44 92 13 3e 0e 65 07 45 04 5f
30 44 92 15 3d 07 5f 07 45 04 5f
30 c3 81 d6 5b 90 35 08 35 44 2c`,
      align: false,
      match: '',
      showAlign: false,
      shift: 0,
      invert: false,
      showShift: false,
      coding: false,
      showCoding: false,
      fmts: 'hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h ',
      comments: true,
      cursor: -1,
      helpFormat: false,
      helpExamples: false,
    }
  },
  created() {
    let uri = window.location.search.substring(1)
    let params = new URLSearchParams(uri);
    let paramCodes = params.getAll('c').join('\n')
    let paramFmt = params.get('f')
    let paramAlign = params.get('a')
    let paramMatch = params.get('m')
    let paramShift = params.get('s')
    let paramInvert = params.get('i')
    let paramCoding = params.get('d')
    if (paramCodes)
      this.codes = paramCodes
    if (paramFmt)
      this.fmts = paramFmt
    if (paramAlign)
      this.align = paramAlign
    if (paramMatch)
      this.match = paramMatch
    if (paramShift)
      this.shift = paramShift
    if (paramInvert)
      this.invert = paramInvert
    if (paramCoding)
      this.coding = paramCoding
  },
  updated() {
  },
  computed: {
    codeLines: function () {
      return this.codes.trim().split('\n')
        .map((el, index) => { return {index: index, bits: new BitString(el) } })

    },
    codesWithAlign: function () {
      var codes = this.codeLines
      var match = new BitString(this.match)
      if (this.align == 'Preamble') {
        return codes
          .map((el, index) => { return {index: index, bits: el.bits.copy().matchPreamble(match) } })
      } else if (this.align == 'Sync') {
        return codes
          .map((el, index) => { return {index: index, bits: el.bits.copy().matchSync(match)} })
      } else {
        return codes
      }
    },
    codesWithShiftInvert: function () {
      var codes = this.codesWithAlign
      return codes
        .map((el, index) => { return {index: index, bits: el.bits.copy()
          .invert(this.invert)
          .shiftRight(this.shift)
        } })
    },
    codesWithCoding: function () {
      var codes = this.codesWithShiftInvert
      if (this.coding == 'MC') {
        return codes
          .map((el, index) => { return {index: index, bits: el.bits.copy().decodeMC()} })
      } else if (this.coding == 'MCI') {
        return codes
          .map((el, index) => { return {index: index, bits: el.bits.copy().decodeMCI()} })
      } else if (this.coding == 'DMC') {
        return codes
          .map((el, index) => { return {index: index, bits: el.bits.copy().decodeDMC()} })
      } else {
        return codes
      }
    },
    url: function () {
      var u = new URL(window.location)
      u.search = '?' +
        this.codes.trim().split('\n')
          .map((el) => 'c=' + encodeURIComponent(el) )
          .join('&') +
        '&f=' + encodeURIComponent(this.fmts) +
        (this.align ? '&a=' + encodeURIComponent(this.align) : '') +
        (this.align ? '&m=' + encodeURIComponent(this.match) : '') +
        (this.shift ? '&s=' + encodeURIComponent(this.shift) : '') +
        (this.invert ? '&i=' + encodeURIComponent(this.invert) : '') +
        (this.coding ? '&d=' + encodeURIComponent(this.coding) : '')
      return u.href
    },
  },
  methods: {
    textareaSelect(event) {
      var textarea = event.target
      this.cursor = textarea.value.substr(0, textarea.selectionStart).split('\n').length - 1
    },
    toggleAlign(align) {
      this.align = this.align == align ? false : align;
    },
    toggleCoding(coding) {
      this.coding = this.coding == coding ? false : coding;
    },
    setFormat(fmt) {
      this.fmts = fmt
    },
    copyUrl(event) {
      var copyEl = event.target.nextSibling
      copyEl.focus()
      copyEl.select()
      try {
        document.execCommand('copy');
      } catch (err) {
        // ignore
      }
    },
  }
}
</script>

<style>
.bench {
  display: flex;
  flex-flow: column;
  align-items: center;
  background: linear-gradient(rgba(0,0,0,0.03), transparent 40px);
}
.dark .bench {
  background: linear-gradient(rgba(0,0,0,0.1), transparent 40px);
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
  color: #6c6;
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
button.active {
  color: #444;
  background: #0c0;
}
button:hover, button:active {
  color: #444;
  background: #0a0;
}
.dark button.active {
  background: #5af;
}
.dark button:hover, .dark button:active {
  background: #38d;
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
.dark input {
  border-bottom: none;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2), 0 -1px 1px rgba(0,0,0,0.1), 0 1px 0 rgba(0,0,0,0.2);
}
input[type=text] {
  color: #44f;
  background: rgba(0,0,0,0.1);
}
input[type=number] {
  max-width: 3.5em;
  padding: 5px 0.5em;
  background: rgba(0,0,0,0.05);
}
input.vanish {
  width: 0;
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
</style>
