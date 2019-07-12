const webpack = require('webpack')
const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

let config = {
  publicPath: '.',
  // productionSourceMap: false,
  assetsDir: '.',

  devServer: {
    port: 1337
  },

  // simple extract
  // css: {
  //   extract: process.env.NODE_ENV !== 'test' ? { filename: '[name].css', chunkFilename: '[name].css' } : false
  // },

  chainWebpack: config => {
    if (process.env.NODE_ENV == 'test') return
    config.output.filename('[name].js')
    config.optimization.splitChunks(false)
    config.output.chunkFilename('[name].js')

    // complex extract
    if (config.plugins.has('extract-css')) {
      config.plugin('extract-css').tap(() => [{ filename: 'style.css', chunkFilename: '[name].css' }])

      const langs = ['css', 'postcss', 'scss', 'sass', 'less', 'stylus']
      const matches = ['vue-modules', 'vue', 'normal-modules', 'normal']

      langs.forEach(lang =>
        matches.forEach(match => {
          const extractCssLoader = config.module
            .rule(lang)
            .oneOf(match)
            .uses.get('extract-css-loader')
          if (extractCssLoader) extractCssLoader.options({ publicPath: '.' })
        })
      )
    }

    // rename element-icons.ttf -> theme.ttf
    config.module.rules.delete('fonts')
    config.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name(file) {
          return file.indexOf('element-icons') !== -1 ? 'theme.[ext]' : '[name].[ext]'
        },
        prefixize: true
      })
  },

  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        JSON5: 'json5'
      }),
      new webpack.LoaderOptionsPlugin({
        options: {
          stylus: {
            import: [path.resolve('src/vars.styl')]
          }
        }
      })
    ],
    module: {
      rules: [
        {
          test: /\.h$/,
          use: [{ loader: path.resolve('enum-loader.js') }]
        }
      ]
    },
    resolve: {
      modules: ['path_to_header_files']
    },
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            output: { comments: false },
            compress: { drop_console: true }
          }
        })
      ]
      // disable splitting for now:
      // splitChunks: {
      //   cacheGroups: {
      //     vendors: {
      //       test: /[\\/]node_modules[\\/]/,
      //       name: 'vendor',
      //       chunks: 'all',
      //       minChunks: 1
      //     },
      //     common: {
      //       name: 'app',
      //       minChunks: 1,
      //       priority: -20,
      //       chunks: 'all',
      //       reuseExistingChunk: true
      //     }
      //   }
      // }
    }
  }
}

module.exports = config
