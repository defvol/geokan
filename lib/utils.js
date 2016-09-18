var http = require('http')
var fs = require('fs');

/**
 * Prepend query key to a bunch of formats
 * @param {array} formats
 * @return {array} res_format:format[n]
 */
module.exports.formats = function (formats) {
  return formats.map(function (f) { return `res_format:${f}` })
}

/**
 * Get usage instructions
 * @return {String} the instructions to run this thing
 */
module.exports.usage = function () {
  var u = [];
  u.push('Find geodata in CKAN');
  u.push('usage: geokan [options]');
  u.push('');
  u.push(' --search a comma-separated list of queries');
  u.push(' --format a comma-separated list of file formats');
  u.push(' --help prints this message');
  u.push(' --version prints package version');
  u.push('');
  return u.join('\n');
};

/**
 * Get module version from the package.json file
 * @return {String} version number
 */
module.exports.version = function () {
  var data = fs.readFileSync(__dirname + '/../package.json');
  return JSON.parse(data).version;
};
