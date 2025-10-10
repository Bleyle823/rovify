const webpack = require('webpack');

class XMTPWasmPlugin {
  apply(compiler) {
    // Handle the 'wbg' module resolution
    compiler.hooks.normalModuleFactory.tap('XMTPWasmPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('XMTPWasmPlugin', (resolveData) => {
        if (resolveData.request === 'wbg') {
          resolveData.request = require.resolve('./wbg-fallback.js');
        }
      });
    });

    // Handle XMTP WASM bindings
    compiler.hooks.normalModuleFactory.tap('XMTPWasmPlugin', (nmf) => {
      nmf.hooks.afterResolve.tap('XMTPWasmPlugin', (resolveData) => {
        if (resolveData.resource && resolveData.resource.includes('bindings_wasm.js')) {
          // Add a custom loader for XMTP WASM bindings
          resolveData.loaders = resolveData.loaders || [];
          resolveData.loaders.push({
            loader: require.resolve('./xmtp-wasm-loader.js'),
            options: {}
          });
        }
      });
    });
  }
}

module.exports = XMTPWasmPlugin;
