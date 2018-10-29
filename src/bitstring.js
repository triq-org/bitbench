// Parse and reformat bit strings

function hexToBits(hexChar) {
  var n = parseInt(hexChar, 16)
  return [n >> 3 & 1, n >> 2 & 1, n >> 1 & 1, n >> 0 & 1]
}

function trimBits(bits, size) {
  var len = bits.length
  bits.length = size
  if (size > len)
    bits.fill(0, len - size)
}

function shiftBits(bits, size = 1, reverse = false, invert = false) {
  var b = bits.slice(0, size)
  if (reverse)
    b = b.reverse()
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

function formatBits(bits, base = 16) {
  var num = 0;
  var pad = Math.ceil(bits.length / Math.log2(base))
  while (bits.length)
    num = num * 2 + bits.shift()
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
    var hexMode = true // false: binary, true: hex
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
        hexMode = true
        text.shift()
      } else if (c == '0' && text[0] == 'b') {
        hexMode = false
        text.shift()
      } else if (c == '{') {
        if (size > 0)
          trimBits(bits, size)
        size = ''
        while (text.length && text[0] != '}')
          size += text.shift()
        text.shift() // pop closing brace
        size = bits.length + parseInt(size, 10)
        if (isNaN(size))
          size = 0
      } else if (hexMode) {
        Array.prototype.push.apply(bits, hexToBits(c))
      } else  {
        bits.push(c == '0' ? 0 : 1)
      }
    }
    if (size > 0)
      trimBits(bits, size)
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
      } else if (f == 'b') {
        if (!size)
          size = 1
        out += formatBitsBin(shiftBits(bits, size, reverse, invert))
        reverse = false
        invert = false
        consumed = true
      } else if (f == 'h') {
        if (!size)
          size = 4
        out += '<span class="hex">' + formatBits(shiftBits(bits, size, reverse, invert), 16) + '</span>'
        reverse = false
        invert = false
        consumed = true
      } else if (f == 'd') {
        if (!size)
          size = 8
        out += '<span class="dec">' + formatBits(shiftBits(bits, size, reverse, invert), 10) + '</span>'
        reverse = false
        invert = false
        consumed = true
      } else if (f == 'r') {
        if (!size)
          size = 4
        out += '<span class="hex">' + trChars(formatBits(shiftBits(bits, size, reverse, invert), 16)) + '</span>'
        reverse = false
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
