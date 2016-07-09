var http = require('http')
var through = require('through2')

/**
 * Figure out the content type of remote resource
 * Without consuming/downloading the resource
 * @param {string} uri to check
 * @param {function} done callback returning a content type
 */
function contentType(uri, done) {
  var req = http.get(uri, (res) => {
    var type = res.headers['content-type']
    req.abort()
    res.on('data', (chunk) => { console.log('you will not see this') })
    res.on('end', () => {
      done(null, type)
    })
  }).on('error', (e) => {
    done(new Error(`Got error: ${e.message}`))
  })
}

/**
 * Return a through stream that parses CKAN search results
 * Expects data to be a CKAN search object
 * @return {function} through stream
 */
function parseStream() {
  return through.obj(function (data, enc, next) {
    var datasets = simplify(data.result.results)
    this.push(datasets)
    next()
  })
}

/**
 * Simplify an array of CKAN search results
 * @param {array} results returned by CKAN
 * @return {array} results with fewer properties
 */
function simplify(results) {
  return results.reduce(function (prev, dataset) {
    return dataset.resources.map(function (resource) {
      return {
        publisher: dataset.organization.name,
        resource: resource.name,
        format: resource.format,
        uri: resource.url
      }
    }).concat(prev)
  }, [])
}

module.exports.contentType = contentType
module.exports.parseStream = parseStream
module.exports.simplify = simplify
