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

function shiftBits(bits, size = 1, reverse = false, reverseBytes = false, invert = false) {
  var b = bits.slice(0, size)
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

function formatBitsBin(bits) {
  return bits
    .map((bit) => bit ? '<b>1</b>' : '<i>0</i>')
    .join('')
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

// format all bits, right aligned, char by char if possible
function formatBits(bits, base = 16) {
  var width = Math.log2(base)
  if (Math.ceil(width) == width) {
    // integral bit width
    return chunkRight(bits, width).map((b) => formatBitsChar(b, base)).join('')
  } else {
    // hope for the best otherwise
    return formatBitsChar(bits, base)
  }
}

// note: it's unsafe to output more than 32 bits in one call
function formatBitsChar(bits, base = 16) {
  var num = 0;
  var pad = Math.ceil(bits.length / Math.log2(base))
  while (bits.length)
    num = (num << 1) + bits.shift()
  return num.toString(base).padStart(pad, '0')
}

function trChars(text) {
  const tr = "·ᚠᚢᚦᚨᚱᚲᚺᚾᛁᛃᛋᛏᛒᛚᛗ"
  return text.split('').map((c) => tr[parseInt(c, 16)]).join('')
}

export default class {
  constructor(arg) {
    this.code = arg
    this.bits = this.strToBits(arg)
  }

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
        while (c != ']')
          c = text.shift()
      } else if (c == '0' && text[0] == 'x') {
        base = 16 // hexadecimal
        text.shift()
      } else if (c == '0' && text[0] == 'd') {
        base = 10 // decimal
        text.shift()
      } else if (c == '0' && text[0] == 'o') {
        base = 8 // octal
        text.shift()
      } else if (c == '0' && text[0] == 't') {
        base = 4 // tristate (2-bit: 0,1,Z,X)
        text.shift()
      } else if (c == '0' && text[0] == 'b') {
        base = 2 // dual
        text.shift()
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

  invert(boolInvert=true) {
    var len = this.bits.length
    if (boolInvert)
      for (var i = 0; i < len; ++i)
        this.bits[i] = this.bits[i] ? 0 : 1
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

  toHex() {
    return this.toFormat('8h ')
  }

  toFormat(fmt) {
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
      } else if (f == 'h') {
        if (!size)
          size = 4
        out += '<span class="hex">' + formatBits(shiftBits(bits, size, reverse, reverseBytes, invert), 16) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'd') {
        if (!size)
          size = 8
        out += '<span class="dec">' + formatBits(shiftBits(bits, size, reverse, reverseBytes, invert), 10) + '</span>'
        reverse = false
        reverseBytes = false
        invert = false
        consumed = true
      } else if (f == 'r') {
        if (!size)
          size = 4
        out += '<span class="hex">' + trChars(formatBits(shiftBits(bits, size, reverse, reverseBytes, invert), 16)) + '</span>'
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
