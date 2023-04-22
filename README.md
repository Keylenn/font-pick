# font-pick 🧺

<a href="https://www.npmjs.com/package/font-pick"><img alt="NPM version" src="https://img.shields.io/npm/v/font-pick.svg"></a> <a href="https://www.npmjs.com/package/font-pick"><img alt="NPM downloads" src="https://img.shields.io/npm/dm/font-pick.svg"></a>

Pick only the fonts you want. 只选你想要的字体。

## ✨特性
+ 支持`http(s)`, 随时随地可以修改
+ 支持在已有字体包上新增字体, 多人协同更轻松
+ 自带压缩功能，生成后字体包更轻量

## ⚡️ 快速开始
```bash
  # npx
  npx font-pick -s 'Hello world' 

  # pnpx
  pnpx font-pick -s 'Hello world' 
```

## 📦 安装
```bash
  # npm
  npm i font-pick -g

  # yarn
  yarn global add font-pick

  # pnpm
  pnpm add font-pick -g
```

## 💡 指令
```bash
  font-pick [options...]
```

| 选项🎯 | 别名🚀 | 描述📝 |
| :-----: | :----: | :----: |
| --help | 🙅‍♂️ | 查看具体用法 |
| --string | -s | 需要新增的字符串，必需❗️ |
| --font | -f | 完整字体包路径，默认选项为`./font.ttf` |
| --base | -b | 基本字体包路径，新增字体会基于这个字体包 |
| --dir | -d | 查找和生成字体包的目录，默认选项为当前工作目录`process.cwd()` |
| --output | -o | 生成字体包的目录，默认选项为`./font-pick` |
| --name | -n | 生成的字体包名称，默认选项为`--font`选项的basename |

## 🥂 字体支持说明

| 格式 💤 | 本地路径 🗂 | http(s) 🔗 |
| :-----: | :----: | :----: |
| ```.ttf``` | ✅ | ✅ |
| ```.otf``` | ✅ | ✅ |
| ```.woff``` | ✅ |  ❌  |
| ```.woff2``` | ❌ |  ❌  |

## 🙋‍♂️ Q&A
#### 什么时候应该使用`font-pick`❓ 
`font-pick`是一个Web字体挑选工具，当你的应用仅需要使用到`部分`特殊字体，不想加载庞大的字体包时，可以使用它进行按需挑选了。

#### `font-pick`和`font-spider`有什么区别❓ 
[`font-spider`](https://github.com/allanguys/font-spider)是一个Web字体压缩工具，可以通过识别模板html页面使用的字体并进行按需压缩，还支持生成其他格式的字体包。然而`font-spider`在压缩字体时需要基于模板html，在二次异地开发或者多人协同的时候容易导致字体覆盖或无法新增字体等弊端。

这就是`font-pick`专注想要解决的问题。`font-pick`不需要模板文件，可直接生成字体包，可以轻松解决`font-spider`在压缩字体时遇到的上述问题。

#### `font-pick`和`font-spider`可以混用吗❓ 
完全可以，`font-pick`的出现不是为了替代`font-spider`，只是为了弥补`font-spider`在压缩字体时遇到的不足。

## 🏗 TODO 
+ 新增支持其他字体格式
+ 新增支持删除字体功能 
+ 新增支持单独压缩字体包功能
+ 新增LOGO