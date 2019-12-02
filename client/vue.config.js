module.exports = {
  chainWebpack: config => {
    config.resolve.alias
      .set('@shared', 'sb-shared')
    config.externals('node-fetch', '')
    config.devtool('source-map')
  },
  devServer: {
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    progress: false
  }
}
