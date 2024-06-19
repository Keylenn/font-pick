#!/usr/bin/env node

const minimist = require("minimist")
const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const elapsed = require("elapsed-time-logger")
const {
  filesize
} = require('filesize')
const http = require('http')
const https = require('https')
const {
  Font
} = require('fonteditor-core')

const pkg = require('../package.json')

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
  if (size > 1024 * 1000) {
    return chalk.red(_size)
  } else if (size > 1024 * 50) {
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
  loadFont: fs.readFileSync
}

function loadFontFromUrl(url) {
  return new Promise((resolve, reject) => {
    const {
      protocol,
      hostname,
      pathname,
      port
    } = new URL(url)
    const isHttps = protocol === "https:"

    const callback = function (res) {
      const chunks = []
      res.on('data', function (chunk) {
        chunks.push(chunk)
      })
      res.on('end', function () {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })
    }

    const ClientRequest = isHttps ? https.get({
      hostname,
      port,
      path: pathname,
      method: 'GET',
      rejectUnauthorized: false, // ignore certificate verification
    }, callback) : http.get(url, callback)

    ClientRequest.on('error', function (err) {
      reject(err)
    })

  })
}

function parsePath(p) {
  const names = path.basename(p).split('.')
  const ext = names.pop()
  return {
    name: names.join('.'),
    ext
  }
}


async function pick() {
  try {
    const progressElapsedTimer = elapsed.start()
    const {
      path: fontPath,
      loadFont
    } = parseFont(argv.font)
    const {
      name: fontName,
      ext
    } = parsePath(fontPath)
    log('fontPath:', pathChalk(argv.font), getSizeByPath(fontPath))

    const buffer = await loadFont(fontPath)

    const filterStringUnicode = [...new Set(argv.string.replace(/\s/g, '').split(''))].map(s => s.charCodeAt())

    const commonCreateFontOption = {
      hinting: true,
      kerning: true,
      compound2simple: true,
      inflate: undefined,
      combinePath: false,
    }
    const font = Font.create(buffer, {
      type: ext,
      subset: filterStringUnicode,
      ...commonCreateFontOption,
    });

    if(argv.base) {
      const {path: baseFontPath, loadFont: loadBaseFont} = parseFont(argv.base)
      log('baseFontPath:', pathChalk(argv.base), getSizeByPath(baseFontPath))
      const baseBuffer = await loadBaseFont(baseFontPath)
      const {
        ext: baseFontExt
      } = parsePath(baseFontPath)
      
      let baseFont = Font.create(baseBuffer, {
        type: baseFontExt,
        ...commonCreateFontOption,
      });

      // Remove duplicate unicode before merge font.
      const baseUnicode = Object.keys(baseFont?.data?.cmap).map(i => +i)
      const filterBaseUnicode = baseUnicode?.filter(i => !filterStringUnicode?.includes(i))
      if(filterBaseUnicode?.length > 0) {
        if(baseUnicode.length !== filterBaseUnicode.length) {
          baseFont = Font.create(baseBuffer, {
            type: baseFontExt,
            subset: filterBaseUnicode,
            ...commonCreateFontOption,
          })
        }
        font.merge(baseFont, {
          scale: 1
        })
      }

    }

    font.sort()

    const outputBuffer = font.write({
      // support ttf, woff, woff2, eot, svg
      type: ext,
      // save font hinting tables, default false
      hinting: false,
      // save font kerning tables, default false
      kerning: false,
      // write glyf data when simple glyph has no contours, default false
      writeZeroContoursGlyfData: false,
      // deflate function for woff, eg. pako.deflate
      deflate: undefined,
      // for user to overwrite head.xMin, head.xMax, head.yMin, head.yMax, hhea etc.
      support: {
        head: {},
        hhea: {}
      }
    });

    const outputDir = path.resolve(argv.dir, argv.output)
    const outputBaseName = `${argv.name || fontName}.${ext}`
    const outputPath = path.join(outputDir, outputBaseName)

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

    fs.writeFileSync(outputPath, outputBuffer)
    log('outputPath:', pathChalk(path.join(argv.output, outputBaseName)), getSizeByPath(outputPath))

    progressElapsedTimer.end(chalk.green('✅ Pick font successfully!'))
    log('💡 You can preview in Here: ' + chalk.blueBright('https://blog.luckly-mjw.cn/tool-show/iconfont-preview/index.html'))

  } catch (error) {
    errorLog(error)
  }
}


// process
if (argv.help) {
  log(`${chalk.green('🗂️ Usage:')}`)
  log(`  ${bashChalk('font-pick --help')} // Print help information`)
  log(`  ${bashChalk('font-pick -s ')}${bashChalk.italic('0123')} // The string that needs to be picked`)
  log(`  ${bashChalk('font-pick -f ')}${bashChalk.italic('./font.ttf')} // Full font package path, the default option is ${defaultArgv.font}`)
  log(`  ${bashChalk('font-pick -b ')}${bashChalk.italic('./base.ttf')} // Basic font package path, new fonts will be based on this font package`)
  log(`  ${bashChalk('font-pick -d ')}${bashChalk.italic('./font')} // Directory where font packages are looked up and generated, the default option is the current working directory`)
  log(`  ${bashChalk('font-pick -o ')}${bashChalk.italic('./font-pick')} // Directory where the font package is generated,  the default option is ${defaultArgv.output}`)
  log(`  ${bashChalk('font-pick -n ')}${bashChalk.italic('font')} // The name of the generated font package, the default option is the basename of the font option`)
  process.exit(0)
} else if(argv.version) {
  log(`${chalk.blueBright(pkg.version)}`)
} else if (!argv.string) {
  errorLog(`Parameter [string] is required! Run "${bashChalk("font-pick --help")}" to learn more`)
  process.exit(-1)
} else {
  pick()
}