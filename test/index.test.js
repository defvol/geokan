var concat = require('concat-stream')
var fs = require('fs')
var geokan = require('../lib/')
var nock = require('nock')
var test = require('tape')
var utils = require('../lib/utils')

var uri = 'http://datos.gob.mx/busca/api/'
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
  var simplify = (new geokan()).simplify
  var simpler = simplify(results)

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
  got = simplify(fakedata)

  t.equal(got.length, 2, 'returns an entry for every resource')
  t.equal(got[0].resource, 'foo', 'an entry for resource foo')
  t.equal(got[1].resource, 'bar', 'an entry for resource bar')

  t.end()
})

test('it finds Content-Type of uri without full download', function (t) {
  t.plan(2)

  var kan = new geokan('https://www.github.com')
  var datasets = kan.simplify(JSON.parse(fixture).result.results)
  var uri = datasets[1].uri

  utils.contentType(uri, (err, type) => {
    t.error(err)
    t.equal(type, 'application/json', 'finds a json file')
  })
})

test('it can search for multiple formats', function (t) {
  t.plan(3)

  var kan = new geokan()
  t.equal(kan.uri, uri, 'by default points to datos.gob.mx')

  var queries = [
    'GeoJSON',
    'KML',
    'KMZ',
    'SHP',
    'CSV'
  ].map(function (f) { return 'res_format:' + f })

  var want = JSON.parse(fixture).result.results.length * queries.length

  var concatStream = concat((data) => {
    t.equal(data.length, want, 'we collected 24 resources')
    t.equal(data[0].publisher, 'cenapred', 'objects were parsed')
  })

  kan.msearch(queries, function (err, streams) {
    streams.forEach(function (s) {
      s.pipe(concatStream)
    })
  })

})
