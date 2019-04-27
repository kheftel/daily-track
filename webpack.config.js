const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const utils = require("./webpack.utils");
const merge = require('webpack-merge');

var baseConfig = merge([{
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        // path: path.resolve(__dirname, 'public'),
        publicPath: "/"
    },
    module: {
        rules: [{
                test: require.resolve('jquery'),
                use: [{
                    loader: 'expose-loader',
                    options: 'jQuery'
                }, {
                    loader: 'expose-loader',
                    options: '$'
                }]
            },
            {
                test: /\.css$/,
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            },
            {
                test: /\.less$/,
                use: [{ // creates style nodes from JS strings
                    loader: 'style-loader'
                }, { // translates CSS into CommonJS
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                }, { // compiles Less to CSS
                    loader: 'less-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            }, /*{
                test: /\.(jpg|png|gif)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[hash].[ext]',
                    },
                },
            },*/
            {
                test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: 'webfonts/[name].[ext]',
                    },
                }]
            }
        ]
    },
    devtool: 'inline-source-map',
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            Chart: 'chart.js'
        }),
        new webpack.ProvidePlugin({
            moment: 'moment'
        })
    ]
}]);

module.exports = merge([
    baseConfig,
    utils.loadImages({
        options: {
            limit: 10000,
            name: "img/[name].[hash:4].[ext]",
        },
    })
]);