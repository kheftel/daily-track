const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const utils = require("./webpack.utils");
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var AssetsPlugin = require('assets-webpack-plugin');
var ManifestPlugin = require('webpack-manifest-plugin');
var Visualizer = require('webpack-visualizer-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var baseConfig = merge([{
    entry: './src/index.js',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        // path: path.resolve(__dirname, 'public'),
        publicPath: "/"
    },
    optimization: {
        splitChunks: {
            chunks: "all",
        },
        runtimeChunk: true,
        namedModules: true,
        namedChunks: true
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
            filename: "[name].[contenthash].css",
        }),
        new AssetsPlugin({
            prettyPrint: true,
            manifestFirst: true
        }),
        new ManifestPlugin({}),
        new Visualizer(),
        new HtmlWebpackPlugin({
            title: 'generated index',
            filename: 'generated.html'
        }),
        new webpack.NamedModulesPlugin()
    ]
}]);

var config = merge([
    baseConfig,
    utils.loadImages({
        options: {
            limit: 10000,
            name: "img/[name].[hash].[ext]",
        },
    }) 
]);

module.exports = mode => {
    // const config = mode === "production" ? productionConfig : developmentConfig;
    return merge([{mode}, config]);

};
