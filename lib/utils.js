var http = require('http')
var fs = require('fs');

/**
 * Figure out the content type of remote resource
 * Without consuming/downloading the resource
 * @param {string} uri to check
 * @param {function} done callback returning a content type
 */
module.exports.contentType = function (uri, done) {
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
 * Get usage instructions
 * @return {String} the instructions to run this thing
 */
module.exports.usage = function () {
  var u = [];
  u.push('Find geodata in CKAN');
  u.push('usage: geokan [options]');
  u.push('');
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
