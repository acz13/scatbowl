console.log("found")

module.exports = {
  babelrcRoots: [
    ".",
    "client",
    "server",
    "shared"
  ],
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: 9
        },
        useBuiltIns: "usage",
        corejs: 3
      }
    ]
  ]
}
