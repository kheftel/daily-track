const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const utils = require("./webpack.utils");
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
                    loader: MiniCssExtractPlugin.loader
                }, {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            },
            {
                test: /\.less$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    utils.autoprefix(),
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
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
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        })
    ]
}]);

module.exports = merge([
    baseConfig,
    // utils.extractCSS({
    //     use: ["css-loader", utils.autoprefix()],
    // }),
    utils.loadImages({
        options: {
            limit: 10000,
            name: "img/[name].[hash:4].[ext]",
        },
    })
]);