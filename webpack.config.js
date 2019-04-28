const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const utils = require("./webpack.utils");
const merge = require('webpack-merge');
var AssetsPlugin = require('assets-webpack-plugin');
var ManifestPlugin = require('webpack-manifest-plugin');
var Visualizer = require('webpack-visualizer-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PATHS = {
    app: path.join(__dirname, "src"),
};

var baseConfig = merge([{
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: "/"
        },
        module: {
            rules: [{
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: 'webfonts/[name].[ext]',
                    },
                }]
            }]
        },
        plugins: [
            new CleanWebpackPlugin(),
            new webpack.ProvidePlugin({
                Chart: 'chart.js'
            }),
            new webpack.ProvidePlugin({
                moment: 'moment'
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
            new webpack.NamedModulesPlugin(),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        ]
    },
    utils.exposeJQuery(),
    utils.favicon(),
    utils.loadJS({
        include: PATHS.app
    })
]);

var devConfig = merge([
    utils.inlineCSS(),
    utils.inlineLESS(),
    utils.loadImages({
        options: {
            include: "./img",
            limit: 100,
            name: "img/[name].[ext]",
        },
    })
]);

var prodConfig = merge([{
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: "/"
        },
        optimization: {
            splitChunks: {
                chunks: "all",
            },
            runtimeChunk: true,
            namedModules: true,
            namedChunks: true
        }
    },
    utils.minifyJS(),
    utils.extractCSS({
        use: [{
            loader: "css-loader",
            options: {
                sourceMap: true
            }
        }]
    }),
    utils.less(),
    utils.minifyCSS({
        options: {
            discardComments: {
                removeAll: true,
            },
            // Run cssnano in safe mode to avoid
            // potentially unsafe transformations.
            safe: true,
            options: {
                sourceMap: true
            }
        },
    }),
    utils.loadImages({
        options: {
            limit: 10000,
            include: "./img",
            name: "img/[name].[ext]",
        },
    }),
    utils.generateSourceMaps({
        type: "source-map"
    }),
    utils.attachRevision()
]);

module.exports = mode => {
    const config = mode === "production" ? prodConfig : devConfig;
    return merge([baseConfig, {
        mode
    }, config]);
};