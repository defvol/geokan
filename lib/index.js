var async = require('async')
var ckan = require('ckan-search')
var through = require('through2')

function Geokan (opts) {
  if (!(this instanceof Geokan)) return new Geokan(opts)
  if (!opts) return new Geokan({})
  this.uri = opts.uri || 'http://datos.gob.mx/busca/api/'
}

/**
 * Search recursively for multiple queries
 * @param {string} url of CKAN instance to query
 * @param {array} queries to perform
 * @param {function} done callback returns array of stream objects
 */
Geokan.prototype.msearch = function (queries, done) {
  var f = this.search.bind(this)
  async.concat(queries, f, function (err, streams) {
    done(err, streams)
  })
}

/**
 * Return a through stream that parses CKAN search results
 * Expects data to be a CKAN search object
 * @return {function} through stream
 */
Geokan.prototype.parseStream = function () {
  var self = this
  return through.obj(function (data, enc, next) {
    var datasets = self.simplify(data.result.results)
    this.push(datasets)
    next()
  })
}

/**
 * Open a stream for a search operation
 * Results are parsed and transformed in the process
 * @param {string} query to perform
 * @param {function} done callback returns stream
 */
Geokan.prototype.search = function (query, done) {
  var s = ckan({ uri: this.uri })
    .stream({ fulltext: query })
    .pipe(this.parseStream())
  done(null, s)
}

/**
 * Simplify an array of CKAN search results
 * @param {array} results returned by CKAN
 * @return {array} results with fewer properties
 */
Geokan.prototype.simplify = function (results) {
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

module.exports = Geokan
