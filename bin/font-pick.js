#!/usr/bin/env node

const opentype = require('opentype.js')
const minimist = require("minimist")
const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const elapsed = require("elapsed-time-logger")
const {filesize} = require('filesize')
const http = require('http')
const https = require('https')

const defaultArgv = {
  font: './font.ttf',
  dir: process.cwd(),
  output: './font-pick'
}

const argv = minimist(process.argv.slice(2), {
  alias: {
    'string': 's',
    'font': 'f',
    'base': 'b',
    'dir': 'd',
    'output': 'o',
    'name': 'n',
  },
  string: ['font', 'base', 'string', 'dir', 'output', 'name'],
  default: defaultArgv,
})

const bashChalk = chalk.hex('#c864c8')
const pathChalk = chalk.yellow
const log = console.log
const errorLog = (msg) => log(chalk.red('❌ Failed to pick font:'), msg)
const getSize = (size) => {
    const _size = filesize(size)
    if(size > 1024 * 1000) {
      return chalk.red(_size)
    } else if(size > 1024 * 50)  {
      return chalk.yellow(_size)
    } else {
      return chalk.green(_size)
    }
}
const isPathUrl = s => /^http(s)?/.test(s)

const getSizeByPath = (path) => isPathUrl(path) ? '' : getSize(fs.statSync(path).size)


const parseFont = (p) => isPathUrl(p) ? {
    path: p,
    loadFont: loadFontFromUrl,
  } : {
    path: path.resolve(argv.dir, p),
    loadFont: opentype.load
  }

function loadFontFromUrl(url) {
  return new Promise((resolve, reject) => {
    const {protocol, hostname, pathname, port} = new URL(url)
    const isHttps = protocol === "https:"

    const callback = function(res) {
      const chunks = []
      res.on('data', function(chunk) {
        chunks.push(chunk)
      })
      res.on('end', function() {
        const buffer = Buffer.concat(chunks)
        const font = opentype.parse(buffer.buffer)
        resolve(font)
      })
    }

    const ClientRequest = isHttps ? https.get({
      hostname,
      port,
      path: pathname,
      method: 'GET',
      rejectUnauthorized: false, // ignore certificate verification
    }, callback) : http.get(url, callback)
    
    ClientRequest.on('error', function(err) {
      reject(err)
    })

  })
}

function parsePath(p) {
  const names =  path.basename(p).split('.')
  const ext = names.pop()
  return {
    name: names.join('.'),
    ext
  }
}





async function pick() {
  try {
    const progressElapsedTimer = elapsed.start()

    const {path: fontPath, loadFont} = parseFont(argv.font)
    const {name: fontName, ext} = parsePath(fontPath)
    log('fontPath:', pathChalk(argv.font), getSizeByPath(fontPath))

    const font = await loadFont(fontPath)
    const stringGlyphs =  font.stringToGlyphs(argv.string)
    console.log(stringGlyphs)

    const create = (glyphs = []) => {
      const pickedFont = new opentype.Font({
        familyName: font.names.fontFamily.en,
        styleName: font.names.fontSubfamily.en,
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        glyphs
      })

      const outputDir = path.resolve(argv.dir, argv.output)
      const outputBaseName = `${argv.name || fontName}.${ext}`
      const outputPath = path.join(outputDir, outputBaseName)
      
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
      
      fs.writeFileSync(outputPath, Buffer.from(pickedFont.toArrayBuffer()))
      log('outputPath:', pathChalk(path.join(argv.output, outputBaseName)), getSizeByPath(outputPath))
    }

    if(argv.base) {
      const {path: basePath, loadFont: loadBase} = parseFont(argv.base)
      log('basePath:', pathChalk(argv.base), getSizeByPath(basePath))
      const base = await loadBase(basePath)

      const mergedGlyphs = []
      const nameUnicodeMap = {}

      const baseGlyphsObject = base.glyphs.glyphs
      for (const key in baseGlyphsObject) {
          if (Object.hasOwnProperty.call(baseGlyphsObject, key)) {
              const glyph = baseGlyphsObject[key]
              nameUnicodeMap[glyph.name] = glyph.unicode
              mergedGlyphs.push(glyph)
          }
      }

      for (sg  of stringGlyphs) {
        if(nameUnicodeMap[sg.name]) continue
        nameUnicodeMap[sg.name] = sg.unicode
        mergedGlyphs.push(sg)
      }
      create(mergedGlyphs)

    } else {
      create(stringGlyphs)
    }
    progressElapsedTimer.end(chalk.green('✅ Pick font successfully!'))
  } catch (error) {
    errorLog(error)
  }
}


// process
if(argv.help) {
  log(`${chalk.green('🗂️ Usage:')}`)
  log(`  ${bashChalk('font-pick --help')} // Print help information`)
  log(`  ${bashChalk('font-pick -s ')}${bashChalk.italic('0123')} // The string that needs to be picked`)
  log(`  ${bashChalk('font-pick -f ')}${bashChalk.italic('./font.ttf')} // Full font package path, the default option is ${defaultArgv.font}`)
  log(`  ${bashChalk('font-pick -b ')}${bashChalk.italic('./base.ttf')} // Basic font package path, new fonts will be based on this font package`)
  log(`  ${bashChalk('font-pick -d ')}${bashChalk.italic('./font')} // Directory where font packages are looked up and generated, the default option is the current working directory`)
  log(`  ${bashChalk('font-pick -o ')}${bashChalk.italic('./font-pick')} // Directory where the font package is generated,  the default option is ${defaultArgv.output}`)
  log(`  ${bashChalk('font-pick -n ')}${bashChalk.italic('font')} // The name of the generated font package, the default option is the basename of the font option`)
  process.exit(0)
} else if(!argv.string) {
  errorLog(`Parameter [string] is required! Run "${bashChalk("font-pick --help")}" to learn more`)
  process.exit(-1)
} else {
  pick()
}

