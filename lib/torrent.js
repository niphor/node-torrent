var crypto       = require('crypto');
var fs           = require('fs');
var b            = require('bncode');
var MemoryStream = require('memorystream');

var Hasher       = require('./hasher');
var buffersMatch = require('./util').buffersMatch;
var iconv        = require('iconv-lite');
var util         = require('./util');
var clone        = require('clone');

/**
 * Converts all buffers in the torrent object to utf8 strings.
 * Except for the key `info.pieces` which will remain a buffer.
 *
 * @param {Object} obj
 * @param {String} pasth
 * @param {String} encoding
 */
var dotUTF8Regexp = /\.utf-?8/i;
var buf2str = function(obj, path, encoding) {
  if(Buffer.isBuffer(obj)){
    if (path !== '.info.pieces') {
      if(/(ed2k)|(filehash)$/i.test(path)){
        return iconv.decode(obj,'hex');
      }else if(dotUTF8Regexp.test(path)){// is utf-8 buffer
        return obj.toString('UTF-8');
      }else{
        return iconv.decode(obj,encoding);
      }
    }
  }
  if(util.isObject(obj)){
    Object.keys(obj).forEach(function(key){
      obj[key]=buf2str(obj[key],path + '.' + key,encoding);
    });
    return obj;
  }

  if(util.isArray(obj)){
    return obj.map(function(item,idx){
      return buf2str(item,path + '.' + idx,encoding);
    }) 
  }
  
  return obj;
};

var str2buf = function(obj, path, encoding) {
  if(util.isString(obj)){
    if (path !== '.info.pieces') {
      if(/(ed2k)|(filehash)$/i.test(path)){
        return iconv.encode(obj,'hex');
      }else if(dotUTF8Regexp.test(path)){// is utf-8 buffer
        return iconv.encode(obj, 'utf-8');
      }else{
        return iconv.encode(obj,encoding);
      }
    }
  }
  if(util.isObject(obj)){
    Object.keys(obj).forEach(function(key){
      obj[key]=str2buf(obj[key],path + '.' + key,encoding);
    });
    return obj;
  }

  if(util.isArray(obj)){
    return obj.map(function(item,idx){
      return str2buf(item,path + '.' + idx,encoding);
    }) 
  }
  
  return obj;
};

/**
 * @constructor
 * @param {Object} metadata
 */
var Torrent = module.exports = function(metadata) {
  this.metadata = metadata;
  
  // detect encoding
  // TODO maybe need a codepage2encoding map to work correct
  var possibleEncoding = (function(){
    var code = metadata['encoding'] || metadata['codepage'];
    if(code && (code = code.toString()) &&iconv.encodingExists(code)){
      return code;
    }
    return 'UTF-8';
  })();

  this.possibleEncoding = possibleEncoding;
  this.originalInfoHash = this.infoHash();

  // Convert all buffers into strings that are not hash pieces.
  buf2str(metadata, '',possibleEncoding);

};


/**
 * @return {String} Returns info hash of torrent
 */
Torrent.prototype.infoHash = function() {
  var info = str2buf(clone(this.metadata.info), '', this.possibleEncoding);
  return crypto
    .createHash('sha1')
    .update(b.encode(info))
    .digest('hex')
    ;
};


/**
 * Creates a readable stream that emits raw torrent data.
 *
 * @return {ReadableStream}
 */
Torrent.prototype.createReadStream = function() {
  var memStream = new MemoryStream();
  memStream.readable = true;
  var info = str2buf(clone(this.metadata), '', this.possibleEncoding);
  
  // Bencode data and emit it from readstream.
  var data = b.encode(info);

  process.nextTick(function() {
    memStream.write(data, function() {
      memStream.emit('end');
    });
  });

  return memStream;
};


/**
 * Shortcut to pipe the readable stream created by Torrent#createReadStream
 * to a writable stream of a file, then return it.
 *
 * @param {String} path
 * @param {Object} options
 * @return {WritableStream}
 */
Torrent.prototype.createWriteStream = function(path, options) {
  var rs = this.createReadStream();
  var ws = fs.createWriteStream(path, options);
  rs.pipe(ws);
  return ws;
};


/**
 * Hash checks torrent.
 *
 * @param {String} dir Directory where files are.
 * @param {Object} options
 * @return {Hasher}
 */
Torrent.prototype.hashCheck = function(dir, options) {
  options = options || {};

  var info = this.metadata.info;

  // Check if this is a single or multi file mode torrent.
  var files = info.files || [{ path: [info.name], length: info.length }];

  // Call the hasher.
  var hashOptions = { maxFiles: options.maxFiles };
  var hasher = new Hasher(dir, files, info['piece length'], hashOptions);
  var percentMatched = 0;
  var piecesMatched = 0;
  var pieces = info.pieces.length / 20;

  hasher.on('hash', function(index, hash, file, position, length) {
    // Check that hash matches.
    if (buffersMatch(info.pieces, hash, index * 20)) {
      percentMatched = Math.round(++piecesMatched / pieces * 10000) / 100;
      hasher.emit('match', index, hash, percentMatched, file, position, length);
    } else {
      hasher.emit('matcherror', index, file, position, length);
    }
  });

  return hasher;
};
