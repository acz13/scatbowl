const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.resolve.alias
      .set('@shared', path.join(__dirname, '../shared'))
    config.externals('node-fetch', '')
  },
  devServer: {
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    }
  }
}
