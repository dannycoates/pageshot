self.port.on("data", function (docData) {
  docData.id = makeRandom();
  docData.domain = domain(docData.location);
  unsafeWindow.injectData(JSON.stringify(docData));
});

var RANDOM_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

function makeRandom(length) {
  length = length || 10;
  var s = "";
  for (var i=0; i<length; i++) {
    s += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length));
  }
  return s;
}

function domain(url) {
  url = url.replace(/.*\/\//, "");
  url = url.replace(/\/.*/, "");
  url = url.replace(/:.*/, "");
  return url;
}

self.port.emit("ready");