const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const utils = require("./webpack.utils");
const merge = require('webpack-merge');
const AssetsPlugin = require('assets-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const DuplicateChecker = require('duplicate-package-checker-webpack-plugin');

const PATHS = {
    app: path.join(__dirname, "src"),
};

var baseConfig = merge([{
        entry: {
            base: './src/base.js',
            charting: './src/charting.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: "/"
        },
        module: {
            rules: [{
                test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
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
                Chart: 'chart.js',
                moment: 'moment',
                $: 'jquery',
                jQuery: 'jquery'
            }),
            new AssetsPlugin({
                prettyPrint: true,
                manifestFirst: true
            }),
            new ManifestPlugin({}),
            new Visualizer(),
            new DuplicateChecker(),
            new HtmlWebpackPlugin({
                title: 'base',
                filename: 'base.html',
                chunks: 'base, vendors'
            }),
            new HtmlWebpackPlugin({
                title: 'charting',
                filename: 'charting.html',
                chunks: 'all'
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

var devConfig = merge([{
        optimization: {
            splitChunks: {
                chunks: "all",
            },
            runtimeChunk: {
                name: 'runtime'
            },
            namedModules: true,
            namedChunks: true
        }
    },
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
            runtimeChunk: {
                name: 'runtime'
            },
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
            limit: 100, // don't embed images that are referenced from outside stylesheets! doh
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
    const retval = merge([baseConfig, {
        mode
    }, config]);

    // console.log('final webpack config:');
    // console.log(JSON.stringify(retval, function(key, value) {
    //     if(value instanceof RegExp)
    //         return value.toString();
    //     if(value instanceof Function)
    //         return 'function';
    //     return value;
    // }, 2));

    return retval;
};