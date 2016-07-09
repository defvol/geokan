#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var concat = require('concat-stream');
var kann = require('./index');
var util = require('./utils');

var geokan = kann();
var multisearch = function (q) {
  geokan.msearch(q, function (error, streams) {
    streams.forEach(function (s) {
      s.pipe(concat(function (data) {
        console.log(JSON.stringify(data));
      }));
    });
  });
};

var queries = argv.search || argv.s;
var formats = argv.format || argv.f;

if (argv.version || argv.v) {
  console.log(util.version());
} else if (argv.help || argv.h) {
  console.log(util.usage());
} else if (queries) {
  multisearch(queries.split(','));
} else if (formats) {
  multisearch(util.formats(formats.split(',')));
} else {
  console.log(util.usage());
}
