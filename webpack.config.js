var webpack = require('webpack');
var StatsPlugin = require('stats-webpack-plugin');
// var MyPlugin = require("webpack-child-compiler");
var HTMLPlugin = require('webpack-html-plugin');
module.exports = {
    entry:  ['./src/index.js','./src/index1.js'],
    profile:true,
    output: {
        path:  'builds',
        // filename: '[chunkhash].output.js',
        filename: "[name].entry.chunk.js",
        publicPath: 'builds/',
    },
    plugins: [

       new HTMLPlugin()
        //配置aync的demo
        // new webpack.optimize.CommonsChunkPlugin({
        //     async: true,
        //     name:     ['main','main1'], // Move dependencies to our main file
        //     minChunks: 2, // How many times a dependency must come up before being extracted
        // }),
         // new StatsPlugin('stats.json', {
         //      chunkModules: true,
         //      exclude: [/node_modules[\\\/]react/]
         //    })
          
          //配置children的demo
         // new webpack.optimize.CommonsChunkPlugin({
         //        filename:'[name].bundle.js',
         //        children:true,
         //        name:      ['main','main1'], // Move dependencies to our main file
         //        minChunks: 2, // How many times a dependency must come up before being extracted
         //    }),


           //没有children和async的配置
           // new webpack.optimize.CommonsChunkPlugin({
           //      filename:'[name].bundle.js',
           //      name:      ['main','main1'], // Move dependencies to our main file
           //      minChunks: 2, // How many times a dependency must come up before being extracted
           //  }),

    ],
    module: {
         loaders: [
         {
            test: /\.js$/,
             enforce: "pre",
             loader: "eslint-loader"
          },
           {
                test:    /\.js/,
                loader:  'babel-loader',
                include: __dirname + '/src',
            },
            {
                test:   /\.scss/,
                loader: 'style-loader!css-loader!sass-loader',
                // Or
               // loaders: ['style', 'css', 'sass'],
               //这里必须是loader后缀
            },
            {
                test:   /\.html/,
                loader: 'html-loader',
            }
        ],
    }
};