<template>
  <div class="bench">
    <p v-if="verbose">
      Enter hex code lines to analyze.
      Prefix 0b for dual, 0d for decimal, 0x for hex, 0o for octal, 0t for ternary (0,1,Z,X).<br/>
      Specify a bit length with {…} prefix (pad/truncate right, left for decimal), text in […] brackets is ignored as comment.
    </p>
    <textarea v-model="codes" placeholder="add lines of hex (no 0x prefix)"></textarea>
    <p v-if="verbose">
      Enter format string:
      <ul>
        <li>"h" for hex (default 4 bits)</li>
        <li>"b" for binary (default 1 bit)</li>
        <li>"d" for decimal (default 8 bits)</li>
        <li>"x" for don&apos;t care / don&apos;t output (default 1 bit)</li>
      </ul>
      Use optional bit length prefix numbers.
      Use "~" to invert bits, use "^" to reverse LSB/MSB, use "&gt;" and "&lt;" to<br/>
      interpret multi-byte values as big-endian (default) or little-endian.
      Other characters are output as-is.<br/>
    </p>
    <div>
      <input type="text" v-model="fmt" size="80"/><br/>
      <a :href="url" @click.prevent="copyUrl">Link to this data and format</a>
      <input class="vanish" :value="url"/> (Click copies to clipboard)
    </div>
    <ul v-if="verbose">
      <li>E.g. <a @click="setFormat('hh ')">"hh "</a> or <a @click="setFormat('8h ')">"8h "</a> for byte-grouped hex output.</li>
      <li><a @click="setFormat('hhhh ')">"hhhh "</a> or <a @click="setFormat('16h ')">"16h "</a> for word-grouped hex output.</li>
      <li><a @click="setFormat('b')">"b"</a> for ungrouped binary output.</li>
      <li><a @click="setFormat('4b 4b | ')">"4b 4b | "</a> for nibble and byte-grouped binary output.</li>
      <li><a @click="setFormat('hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h ')">"hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h "</a> e.g. for the example data.</li>
    </ul>
    <p>
      Shift or invert all bits.
      <button v-on:click="shift -= 1"><span>&lt;&lt;</span></button>
      <input type="number" v-model="shift">
      <button v-on:click="shift += 1"><span>&gt;&gt;</span></button>
      <button v-on:click="invert = !invert" :class="{'active': invert}"><span>~</span></button>
      Pad Left and Pad Right below.<br/>
    </p>
    <div id="code-lines">
      <BitBox v-for="(code, index) in codeLines" :key="code.index"
        :class="{'even': index % 2 === 0, 'odd': index % 2 !== 0 }"
        :code="code.val" :shift="shift" :invert="invert" :fmt="fmt"/>
    </div>
  </div>
</template>

<script>
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
      shift: 0,
      fmt: 'hh ID:hh b CH3d TEMP_C:12d HUM:d CRC:8h | 8h 16h 16h ',
      invert: false,
    }
  },
  created() {
    let uri = window.location.search.substring(1)
    let params = new URLSearchParams(uri);
    let paramCodes = params.getAll("c").join('\n')
    let paramFmt = params.get("f")
    if (paramCodes)
      this.codes = paramCodes
    if (paramFmt)
      this.fmt = paramFmt
  },
  updated() {
  },
  computed: {
    codeLines: function () {
      return this.codes.trim().split('\n')
        .map((el, index) => { return {index: index, val: el} })
    },
    url: function () {
      var u = new URL(window.location)
      u.search = "?" +
        this.codes.trim().split('\n')
          .map((el) => "c=" + encodeURIComponent(el) )
          .join('&') +
        "&f=" + encodeURIComponent(this.fmt)
      return u.href
    },
  },
  methods: {
    setFormat(fmt) {
      this.fmt = fmt
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
  border-top: 1px solid #999;
  border-bottom: 1px solid #999;
  padding: 1em 2em;
  color: #44f;
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
button {
  min-width: 2.5em;
  padding: 7px 6px;
  color: #333;
  background: #ddd;
  border: none;
}
button:hover, .button:active {
  color: #444;
  background: #0a0;
} 
button.active {
  color: #444;
  background: #0c0;
} 

.box {
  background: rgba(0,0,0,0.05);
}
.box.even {
  background: rgba(0,0,0,0.1);
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
  text-align: center;
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
.bits {
  color:#aaa;
}
.bits span, .bits b, .bits i {
  padding: 3px 1px;
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
  background: #ccf;
}
</style>
