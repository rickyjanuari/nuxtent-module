const { existsSync, readFileSync, statSync } = require('fs')
const { join } = require('path')
const fm = require('front-matter')
const moment = require('moment')
const paramCase = require('param-case')
const permalinkCompiler = require('path-to-regexp').compile

export default function prepPage (meta, options, isDev) {
  const cached = {}
  return {
    create (params = {}) {
      const props = new Set(
        ['meta', 'date', 'path', 'permalink', 'anchors', 'attributes', 'body']
      )

      if (params.exclude) {
        params.exclude.split(',').forEach(prop => {
          if (props.has(prop)) props.delete(prop)
        })
      }

      let data = {}
      props.forEach(prop => {
        if (prop === 'attributes')  data =  { ...this[prop], ...data }
        else data[prop] = this[prop]
      })

      return data
    },

    get meta () {
      return meta
    },

    get path () {
      const { permalink } = this
      if (isDev || !options.routes) return permalink
      const dynamicRoute = options.routes.find(route => route.method === 'get')
      const nestedPath = /([^_][a-zA-z]*?)\/[^a-z\_]*/
      const matchedPath = dynamicRoute.path.match(nestedPath)
      if (matchedPath && matchedPath[1] !== 'index') {
        return join(matchedPath[1] + permalink)
      } else {
        return permalink
      }
    },

    get permalink () {
      if (isDev || !cached.permalink) {
        const { date } = this
        const { section, fileName } = meta
        const slug = getSlug(fileName)
        const { year, month, day } = splitDate(date)
        const params = { section, slug, date, year, month, day }
        const toPermalink = permalinkCompiler(options.permalink)
        cached.permalink = join('/', toPermalink(params, { pretty: true })
          .replace(/%2F/gi, "/")) // make url encoded slash pretty
      }
      return cached.permalink
    },

    get anchors () {
      if (isDev || !cached.anchors) {
        if (meta.fileName.search(/\.md$/) > -1) {
          const { _rawData } = this
          const level = options.anchorsLevel

          const anchorsExp = new RegExp([
            '(`{3}[\\s\\S]*?`{3}|`{1}[^`].*?`{1}[^`]*?)',   // code snippet
            `(#{${level + 1},})`,                           // other heading
            `(?:^|\\s)#{${level}}[^#](.*)`,                 // heading text
          ].join('|'), 'g')

          let result
          let anchors = []
          while (result = anchorsExp.exec(_rawData)) {
            let [match, codeSnippet, otherHeading, headingText] = result
            if (!(codeSnippet || otherHeading) && headingText) {
              const anchor = `#${paramCase(headingText)}`
              anchors.push([anchor, headingText])
            }
          }
          cached.anchors = anchors
        } else { // yaml file
          cached.anchors = []
        }
      }
      return cached.anchors
    },

    get attributes () {
      return this._rawData.attributes
    },

    get body () {
      if (isDev || !cached.body) {
        const { _rawData } = this
        const { parsers } = options
        const { dirName, section, fileName } = meta
        if (fileName.search(/\.comp\.md$/) > -1) {
          const relativePath = '.' +  join(dirName, section, fileName)
          cached.body = {
            relativePath // component body compiled by loader and imported separately
          }
        } else if (fileName.search(/\.md$/) > -1) {
          cached.body = parsers.mdParser(parsers.md, options)
            .render(_rawData.body) // markdown to html
        } else if (fileName.search(/\.yaml$/) > -1) {
          cached.body = parsers.yamlParser()
            .render(_rawData.body) // yaml to json
        }
      }
      return cached.body
    },

    get date () {
      if (isDev || !cached.date) {
        const { filePath, fileName, section } = meta
        if (options.isPost) {
          const fileDate = fileName.match(/!?(\d{4}-\d{2}-\d{2})/) // YYYY-MM-DD
          if (!fileDate) throw Error(`Post in "${section}" does not have a date!`)
          cached.date = fileDate[0]
        } else {
          const stats = statSync(filePath)
          cached.date = moment(stats.ctime).format('MM-DD-YYYY')
        }
      }
      return cached.date
    },


    get _rawData () {
      if (isDev || !cached.data) {
        const source = readFileSync(meta.filePath).toString()
        if (meta.fileName.search(/\.md$/) > -1) {
          const { attributes, body } = fm(source)
          cached.data = { attributes, body }
        } else if (meta.fileName.search(/\.yaml$/) > -1) {
          cached.data = { attributes: {}, body: source }
        }
      }
      return cached.data
    }
  }
}

function getSlug (fileName) {
  const onlyName = fileName
    .replace(/(\.comp)?(\.[0-9a-z]+$)/, '') // remove any ext
    .replace(/!?(\d{4}-\d{2}-\d{2}-)/, '')  // remove date and hypen
  return paramCase(onlyName)
}

function splitDate (date) {
  const dateData = date.split('-')
  return  {
    year: dateData[0],
    month: dateData[1],
    day: dateData[2]
  }
}
