const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.resolve.alias
      .set('@shared', path.join(__dirname, '../shared'))
    config.externals('node-fetch', '')
    config.devtool('source-map')
  },
  devServer: {
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    }
  }
}
