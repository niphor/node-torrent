# node-torrent

Read, make, and hash check torrents with node.js!

# What is this?

node-torrent with decoding/encoding fix.

now it can decode/encode with the possible right encoding , and get the right info hash.

if you want change encoding,do this:
```js
Torrent.possibleEncoding  = '<right encoding>';
Torrent.metadata.encoding = '<right encoding>';
delete Torrent.metadata.pagecode //if it exsit

```

if you want to get the original Info Hash
```js
var btih = Torrgent.originalInfoHash;
```
>I get it right after Torrent object is created,because after metadata decoded with the wrong encoding, info hash maybe is wrong.

# Issues

possible some performance issues

# License

MIT
