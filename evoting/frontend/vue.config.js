module.exports = {
  chainWebpack: config => {
    // Add a loader for the TOML file we use.
    // https://cli.vuejs.org/guide/webpack.html#adding-a-new-loader
    config.module
      .rule('toml')
      .test(/\.toml$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  },
  publicPath: '.',
  outputDir: '../server/dist'
}
