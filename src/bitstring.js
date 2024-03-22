// Parse and reformat bit strings

function hexToBits(hexChar) {
  var n = parseInt(hexChar, 16)
  return [n >> 3 & 1, n >> 2 & 1, n >> 1 & 1, n >> 0 & 1]
}

function octToBits(octChar) {
  var n = parseInt(octChar, 8)
  return [n >> 2 & 1, n >> 1 & 1, n >> 0 & 1]
}

function terToBits(terChar) {
  terChar = terChar.replace(/Z/g, '2').replace(/X/g, '3')
  var n = parseInt(terChar, 4)
  return [n >> 1 & 1, n >> 0 & 1]
}

function decToBits(decChar) {
  var n = parseInt(decChar, 10)
  // coerce to unsigned
  return (n >>> 0).toString(2).split('').map((b) => b == '0' ? 0 : 1)
}

function trimBitsRight(bits, size) {
  var len = bits.length
  bits.length = size
  if (size > len)
    bits.fill(0, len - size)
}

function trimBitsLeft(bits, size) {
  while (bits.length > size)
    bits.shift()
  while (bits.length < size)
    bits.unshift(0)
}

function shiftBits(bits, size = 1, reverse = false, reverseBytes = false, invert = false, zeroFill = false) {
  var b = bits.slice(0, size)
  b.truncated = (b.length != size)
  b.classes = b.truncated ? ' truncated' : ''
  if (b.truncated && zeroFill) {
    trimBitsRight(b, size)
    b.zeroFill = true
    b.classes = ' zerofill'
  }
  if (reverse)
    b = b.reverse()
  if (reverseBytes)
    b = Array.prototype.concat.apply([], b.reduce((acc, cur, i) => {
      if (!acc[i>>3])
        acc[i>>3] = []
      acc[i>>3].push(cur)
      return acc
    }, []).reverse())
  if (invert)
    for (var i = 0; i < size; ++i)
      b[i] = !b[i]
  for (; size > 0; --size)
    bits.shift()
  return b
}

// Shifts a number out of bits.
// Requesting more than 52 bit returns a BigInt.
// Signed (2's complement) is only available up 32 bits.
// Note: using multiplication by 2 instead of left-shift which is limited to signed 32 bit
function shiftNum(bits, size = 0, signed = false) {
  const width = Math.min(size || bits.length, bits.length)
  if (width > 52) {
    // maximum safe integer primitive is 52 bits, use BigInt for wider numbers
    let num = BigInt(0)
    for (let i = 0; i < width; i +=1) {
      num = (num * BigInt(2)) + BigInt(bits.shift())
    }
    return num

  } else {
    let num = 0
    for (let i = 0; i < width; i +=1) {
        num = (num * 2) + bits.shift()
    }
    if (signed && width <= 32) {
      const shift_amount = 32 - width
      num = (num << shift_amount) >> shift_amount
    }
    return num
  }
}

function formatBitsBin(bits) {
  return bits
    .map((bit) => bit ? '<b>1</b>' : '<i>0</i>')
    .join('')
}

function formatBitsPop(bits, width = 1) {
  return chunkRight(bits, width)
    .map((b) => formatNumHeat(b.reduce((acc, cur) => acc + cur), width))
    .join('')
}

function formatBitsValue(bits, width = 1) {
  return chunkRight(bits, width)
    .map((b) => formatNumHeat(parseInt(b.join(''), 2), 2**width - 1))
    .join('')
}

function formatNumHeat(num, maxNum = 1) {
  num = ~~(num * 24 / maxNum);
  return `<em class="h${num}">█</em>`
}

// break every chunkSize elements, right align (the first chunk may have less elements)
function chunkRight(ary, chunkSize = 8) {
  var chunks = []
  var len = ary.length
  var rem = len % chunkSize
  if (rem)
    chunks.push(ary.slice(0, rem))
  for (var off = rem; off < len; off += chunkSize) {
    chunks.push(ary.slice(off, off + chunkSize))
  }
  return chunks
}

// format 32 or 64 bits, to float
function formatBitsFloat(bits) {
  const width = bits.length
  if (width != 32 && width != 64) {
    return 'NaF'
  }
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)

  for (let i = 0; i < width / 8; i += 1) {
    const num = shiftNum(bits, 8)
    view.setUint8(i, num)
  }

  if (width == 32) {
    return view.getFloat32(0).toString()
  } else {
    return view.getFloat64(0).toString()
  }
}

// format all bits, right aligned, char by char if possible
// signed (2's complement) is only available for base 10 format and only up 32 bits
function formatBits(bits, base = 16, signed = false) {
  var width = Math.log2(base)
  if (Math.ceil(width) == width) {
    // integral bit width
    return chunkRight(bits, width).map((b) => formatBitsChar(b, base)).join('')
  } else {
    // hope for the best otherwise
    return formatBitsChar(bits, base, signed)
  }
}

// note: using multiplication by 2 instead of left-shift which is limited to signed 32 bit
// signed (2's complement) is only available for base 10 format and only up 32 bits
function formatBitsChar(bits, base = 16, signed = false) {
  const pad = Math.ceil(bits.length / Math.log2(base))
  let num = shiftNum(bits, bits.length, signed)
  if (base == 256) { // special case ascii
    const inv = num >= 128
    num %= 128
    const ctrl = (num < 32 || num == 127)
    if (ctrl)
      num = (num + 64) % 128
    const cls = (ctrl ? 'ctrl' : '') + (inv ? ' inv' : '')
    return `<span class="${cls}">${ctrl ? '^' : ''}${String.fromCharCode(num)}</span>`
  }
  if (signed) {
    // pad with spaces and one extra char for the minus sign
    return num.toString(base).padStart(pad + 1, '\xa0') // Non-breaking space is char 0xa0 (160 dec)
  }
  return num.toString(base).padStart(pad, '0')
}

function trChars(text) {
  const tr = "·ᚠᚢᚦᚨᚱᚲᚺᚾᛁᛃᛋᛏᛒᛚᛗ"
  return text.split('').map((c) => tr[parseInt(c, 16)]).join('')
}

function strToComments(text) {
  var comments = text.match(/\[.+?\]/g) || []
  return comments.join()
}

function arrCompare(a, b, begin = 0, end = -1) {
  for (var i = begin; i < end; i += 1) {
    if (a[i] < b[i])
      return -1
    else if (a[i] > b[i])
      return 1
  }
  return 0
}

export default class {
  constructor(arg) {
    if (typeof arg == 'string' || arg instanceof String) {
      this.code = arg
      this.error = false
      this.bits = this.strToBits(arg)
      this.comments = strToComments(arg)
    } else {
      this.code = arg.code
      this.error = arg.error
      this.bits = arg.bits.slice()
      this.comments = arg.comments
    }
  }

  copy() {
    var dup = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
    dup.bits = dup.bits.slice() // deep copy
    return dup
  }

  // parser

  strToBits(text) {
    var bits = []
    text = text.split('')
    var base = 16 // default: hex
    var size = 0
    while (text.length) {
      var c = text.shift()
      if (c == ' ' || c == '\t') {
        // skip
      } else if (c == '[') {
        // skip comment
        while (text.length && c != ']')
          c = text.shift()

      } else if (c == '0' && text[0] == 'x') {
        base = 16 // hexadecimal
        text.shift()
      } else if (c == '0' && text[0] == 'z') {
        base = 10 // decimal
        text.shift()
      } else if (c == '0' && text[0] == 'o') {
        base = 8 // octal
        text.shift()
      } else if (c == '0' && text[0] == 't') {
        base = 4 // tristate (2-bit: 0,1,Z,X)
        text.shift()
      } else if (c == '0' && text[0] == 'y') {
        base = 2 // dual
        text.shift()

      } else if (c == 'x') {
        base = 16 // hexadecimal
      } else if (c == 'z') {
        base = 10 // decimal
      } else if (c == 'o') {
        base = 8 // octal
      } else if (c == 't') {
        base = 4 // tristate (2-bit: 0,1,Z,X)
      } else if (c == 'y') {
        base = 2 // dual

      } else if (c == '{') {
        if (size > 0)
          trimBitsRight(bits, size)
        size = ''
        while (text.length && text[0] != '}')
          size += text.shift()
        text.shift() // pop closing brace
        // overall target length after the bits are added
        size = bits.length + parseInt(size, 10)
        if (isNaN(size))
          size = 0
      } else if (base == 16) {
        Array.prototype.push.apply(bits, hexToBits(c))
      } else if (base == 8) {
        Array.prototype.push.apply(bits, octToBits(c))
      } else if (base == 4) {
        Array.prototype.push.apply(bits, terToBits(c))
      } else if (base == 10) {
        // special case, read the whole number in, and pad left
        while (text[0] >= '0' && text[0] <= '9')
          c += text.shift()
        var b = decToBits(c)
        if (size > 0)
          trimBitsLeft(b, size - bits.length) // just the field length
        size = 0
        Array.prototype.push.apply(bits, b)
      } else  {
        bits.push(c == '0' ? 0 : 1)
      }
    }
    if (size > 0)
      trimBitsRight(bits, size)
    return bits
  }

  // simple ops

  invert(boolInvert=true) {
    var len = this.bits.length
    if (boolInvert)
      for (var i = 0; i < len; ++i)
        this.bits[i] = this.bits[i] ? 0 : 1
    return this
  }

  xor(xorText = '') {
    if (xorText) {
      var xbits = this.strToBits(xorText)
      var xlen = xbits.length

      // hidden mode: if mask is all 0 then take mask from start of data
      var n = 0
      for (var j = 0; j < xlen; ++j) {
        n = n * 2 + xbits[j]
      }
      if (n == 0)
        xbits = this.bits.slice(0, xbits.length)

      var len = this.bits.length
      for (var i = 0; i < len; ++i)
        this.bits[i] ^= xbits[i % xlen]
    }
    return this
  }

  reflect(boolReflect = true) {
    var len = this.bits.length
    if (boolReflect)
      for (var i = 0; i < len; i += 8) {
        var byte = this.bits.slice(i, i + 8)
        this.bits[i + 0] = byte[7]
        this.bits[i + 1] = byte[6]
        this.bits[i + 2] = byte[5]
        this.bits[i + 3] = byte[4]
        this.bits[i + 4] = byte[3]
        this.bits[i + 5] = byte[2]
        this.bits[i + 6] = byte[1]
        this.bits[i + 7] = byte[0]
      }
    return this
  }

  shiftLeft(shiftAmount=1) {
    for (; shiftAmount < 0; ++shiftAmount)
      this.bits.unshift(0)
    for (; shiftAmount > 0; --shiftAmount)
      this.bits.shift()
    return this
  }

  shiftRight(shiftAmount=1) {
    for (; shiftAmount < 0; ++shiftAmount)
      this.bits.shift()
    for (; shiftAmount > 0; --shiftAmount)
      this.bits.unshift(0)
    return this
  }

  padLeft(padAmount = 1) {
    for (; padAmount < 0; ++padAmount)
      this.bits.shift()
    for (; padAmount > 0; --padAmount)
      this.bits.unshift(0)
    return this
  }

  padRight(padAmount = 1) {
    for (; padAmount < 0; ++padAmount)
      this.bits.pop()
    for (; padAmount > 0; --padAmount)
      this.bits.push(0)
    return this
  }

  // summary functions

  sumAdd(offset = 0, length = 0, width = 4) {
    if (width <= 0)
      return 0
    if (offset < 0)
      offset = this.bits.length + offset
    if (length <= 0)
      length = this.bits.length + length

    var sum = 0
    for (var i = offset; i < offset + length - width + 1;) {
      var end = i + width
      var n = 0
      for (; i < end; ++i) {
        n = n * 2 + this.bits[i]
      }
      sum += n
    }
    return sum
  }

  sumXor(offset = 0, length = 0, width = 4) {
    if (width <= 0)
      return 0
    if (offset < 0)
      offset = this.bits.length + offset
    if (length <= 0)
      length = this.bits.length + length

    var sum = 0
    for (var i = offset; i < offset + length - width + 1;) {
      var end = i + width
      var n = 0
      for (; i < end; ++i) {
        n = n * 2 + this.bits[i]
      }
      sum ^= n
    }
    return sum
  }

  // transform ops

  matchPreamble(match) {
    if (match && match.bits.length > 0) {
      var matchLen = match.bits.length
      while (this.bits.length > 0 && arrCompare(this.bits, match.bits, 0, matchLen))
        this.bits.shift()
      for (var i = match.bits.length; this.bits.length > 0 && i > 0; i -= 1)
        this.bits.shift()
    }
    return this
  }

  matchSync(match) {
    if (match && match.bits.length > 0) {
      var matchLen = match.bits.length
      while (this.bits.length > 0 && arrCompare(this.bits, match.bits, 0, matchLen))
        this.bits.shift()
    }
    return this
  }

  decodeMC() {
    var ret = []
    for (var i = 0; i + 1 < this.bits.length; i += 2) {
      if (this.bits[i] > this.bits[i + 1])
        ret.push(1)
      else if (this.bits[i] < this.bits[i + 1])
        ret.push(0)
      else {
        this.error += 1
        break
      }
    }
    this.bits = ret
    return this
  }

  decodeMCI() {
    var ret = []
    for (var i = 0; i + 1 < this.bits.length; i += 2) {
      if (this.bits[i] < this.bits[i + 1])
        ret.push(1)
      else if (this.bits[i] > this.bits[i + 1])
        ret.push(0)
      else {
        this.error += 1
        break
      }
    }
    this.bits = ret
    return this
  }

  decodeDMC() {
    var ret = []
    for (var i = 0; i + 1 < this.bits.length; i += 2) {
      if (this.bits[i] == this.bits[i + 1])
        ret.push(1)
      else
        ret.push(0)
      if (i + 1 < this.bits.length && this.bits[i + 1] == this.bits[i + 2]) {
        this.error += 1
        break
      }
    }
    this.bits = ret
    return this
  }

  // output

  toHex() {
    return this.toFormat('8h ')
  }

  toFormat(fmt, options = {}) {
    const zeroFill = options.zeroFill
    var out = ''
    var bits = this.bits.slice()
    var fmts = fmt.split('')
    var reverse = false
    var reverseBytes = false
    var invert = false
    var consumed = false
    while (bits.length) {
      if (!fmts.length)
        if (consumed)
          fmts = fmt.split('')
        else
          break

      // pop a number if available
      var size = ''
      while (fmts[0] >= '0' && fmts[0] <= '9')
        size += fmts.shift()
      size = parseInt(size, 10)
      if (isNaN(size))
        size = 0

      // get flags or apply a format
      var f = fmts.shift()
      if (f == '~') {
        invert = !invert
      } else if (f == '^') {
        reverse = !reverse
      } else if (f == '>') {
        reverseBytes = false
      } else if (f == '<') {
        reverseBytes = true
      } else if (f == 'b') {
        if (!size)
          size = 1
        out += formatBitsBin(shiftBits(bits, size, reverse, reverseBytes, invert))
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'p') { // population count as heatmap
        if (!size)
          size = 1
        out += formatBitsPop(shiftBits(bits, size, reverse, reverseBytes, invert), size)
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'v') { // value as heatmap
        if (!size)
          size = 1
        out += formatBitsValue(shiftBits(bits, size, reverse, reverseBytes, invert), size)
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'h') {
        if (!size)
          size = 4
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="hex' + b.classes + '">' + formatBits(b, 16) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'd') {
        if (!size)
          size = 8
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="dec' + b.classes + '">' + formatBits(b, 10, false) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 's') {
        if (!size)
          size = 8
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="dec' + b.classes + '">' + formatBits(b, 10, true) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'f') {
        if (!size)
          size = 32
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="dec' + b.classes + '">' + formatBitsFloat(b) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'c') {
        if (!size)
          size = 8
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="chr' + b.classes + '">' + formatBits(b, 256) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'r') {
        if (!size)
          size = 4
        const b = shiftBits(bits, size, reverse, reverseBytes, invert, zeroFill)
        out += '<span class="hex' + b.classes + '">' + trChars(formatBits(b, 16)) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'x') {
        if (!size)
          size = 1
        shiftBits(bits, size)
        reverse = false
        invert = false
        consumed = true
      } else {
        // or render plain char
        out += f
      }
    }
    return out
  }
}
