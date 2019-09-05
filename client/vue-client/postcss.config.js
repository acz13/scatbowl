const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    purgecss({
      content: [
        './src/**/*.vue',
        './src/**/*.js',
        './src/**/*.html',
        './public/index.html'
      ],
      fontFace: true
    })
  ]
}
