var async = require('async')
var ckan = require('ckan-search')
var concat = require('concat-stream')
var fs = require('fs')
var nock = require('nock')
var test = require('tape')
var geokan = require('../lib/')

var uri = 'http://datos.gob.mx/busca/api/'
var searcher = ckan({ uri: uri })
var fixture = fs.readFileSync('results.json')

nock(uri)
  .persist()
  .get(/package_search/)
  .query(function (query) { return query.start == 0 })
  .reply(200, fixture)
nock(uri)
  .persist()
  .get(/package_search/)
  .query(function (query) { return query.start > 0 })
  .reply(200, { result: { results: [] } })

test('it builds simpler objects', function (t) {
  var response = JSON.parse(fixture)
  var results = response.result.results
  var simpler = geokan.simplify(results)

  var got = simpler[0]
  var want = ['publisher', 'resource', 'format', 'uri']

  t.deepEqual(Object.keys(got), want, 'keeping just a few properties')
  t.equal(got.publisher, 'cenapred', 'including publisher name')
  t.true(got.uri.match(/http/), 'and resource uri')
  t.equal(simpler.length, results.length, 'finds the same number of objs')

  var fakedata = [
    {
      organization: { name: 'Evil corp' },
      resources: [
        { name: 'foo', format: 'kml', uri: 'foo.kml'},
        { name: 'bar', format: 'shp', uri: 'bar.shp'}
      ]
    }
  ]
  got = geokan.simplify(fakedata)

  t.equal(got.length, 2, 'returns an entry for every resource')
  t.equal(got[0].resource, 'foo', 'an entry for resource foo')
  t.equal(got[1].resource, 'bar', 'an entry for resource bar')

  t.end()
})

test('it finds Content-Type of uri without full download', function (t) {
  t.plan(2)

  var datasets = geokan.simplify(JSON.parse(fixture).result.results)
  var uri = datasets[1].uri

  geokan.contentType(uri, (err, type) => {
    t.error(err)
    t.equal(type, 'application/json', 'finds a json file')
  })
})

test('it searchs for multiple formats', function (t) {
  t.plan(7)

  var formats = [
    'GeoJSON',
    'KML',
    'KMZ',
    'SHP',
  ].map(function (f) { return 'res_format:' + f })

  var concatStream = concat((data) => {
    t.equal(data.length, 24, 'we collected 24 resources')
    t.equal(data[0].publisher, 'cenapred', 'objects were parsed')
  })

  var search = function (format, done) {
    var s = searcher.stream({ fulltext: 'res_format:' + format })
    s.on('end', () => {
      t.ok(format, 'stream ended for ' + format)
    })
    s.pipe(geokan.parseStream()).pipe(concatStream)
    done(null, s)
  }

  async.concat(formats, search, function (err, streams) {
    t.equal(streams.length, formats.length, 'invokes 4 search streams')
  })

})
