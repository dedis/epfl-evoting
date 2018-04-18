const txt2dict = (txt, opt_operator) => {
  if (! opt_operator) {
    opt_operator = '=';
  }
  var dict = {};
  txt.split('\n').forEach(function (line) {
    line = line.replace(/\r$/, '');
    var sepIndex = line.indexOf(opt_operator);
    if (sepIndex == -1) {
      if (line.length)
        return;
    }
    var k = line.slice(0, sepIndex);
    var v = line.slice(sepIndex + opt_operator.length);
    dict[k] = v;
  });
  return dict;
}

const dict2txt = (data) => {
  return Object.keys(data).map(k => k + '=' + data[k] + '\n').join('').slice(0, -1)
}

const Uint8ArrayToHex = data => {
  return Array.from(data, b => {
    return ('0' + (b & 0xff).toString(16)).slice(-2)
  }).join('')
}

module.exports = {
  Uint8ArrayToHex,
  txt2dict,
  dict2txt
}
