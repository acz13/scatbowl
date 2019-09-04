const PurgecssPlugin = require('purgecss-webpack-plugin')
const glob = require('glob')

module.exports = {
  configureWebpack: {
    plugins: [
      new PurgecssPlugin({
        paths: glob.sync('./src/**/*.{vue,js}')
      })
    ]
  },
  devServer: {
    disableHostCheck: true
  }
}
