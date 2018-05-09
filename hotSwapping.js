module.exports = {
  cleanRequireCache: (modulePath) => {
    //from http://fex.baidu.com/blog/2015/05/nodejs-hot-swapping/
    var _module = require.cache[modulePath];
    // remove reference in module.parent
    if(_module === undefined){
      return
    }
    if (_module.parent) {
      _module.parent.children.splice(_module.parent.children.indexOf(_module), 1);
    }
    require.cache[modulePath] = null;
  }
}