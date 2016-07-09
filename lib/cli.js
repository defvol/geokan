#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var concat = require('concat-stream');
var kann = require('./index');
var util = require('./utils');

var geokan = kann();
var queries = argv.search || argv.s;
var formats = argv.format || argv.f;

var concatStream = concat(function (data) {
  console.log(JSON.stringify(data));
});

if (argv.version || argv.v) {
  console.log(util.version());
} else if (argv.help || argv.h) {
  console.log(util.usage());
} else if (queries) {
  geokan.msearch(queries.split(','), function (error, streams) {
    streams.forEach(function (s) {
      s.pipe(concatStream);
    });
  });
} else if (formats) {
  formats = util.formats(formats.split(','))
  geokan.msearch(formats, function (error, streams) {
    streams.forEach(function (s) {
      s.pipe(concatStream);
    });
  });
} else {
  console.log(util.usage());
}
