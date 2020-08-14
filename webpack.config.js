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
const fs = require('fs');

// hack to be able run production builds on local machine w/o env vars actually in environment
// if (fs.existsSync('.env')) {
//     require('dotenv').config();
// }

const PATHS = {
    app: path.join(__dirname, "src"),
};

var baseConfig = merge([
    {
        entry: {
            // base: './src/base.js',
            // charting: './src/charting.js',
            overview: './src/js/pages/overview.js',
            dataset: './src/js/pages/dataset.js',
            register: './src/js/pages/register.js',
            login: './src/js/pages/login.js',
            "set-form": './src/js/pages/set-form.js',
            multi: './src/js/pages/multi.js',
            styles: './src/js/styles.js',
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: "/"
        },
        optimization: {
            splitChunks: {
                chunks: "initial",
                cacheGroups: {
                    "vendors-chart": {
                        name: "vendors-chart",
                        test: /ChartConfig|chart\.js|hammerjs|chartjs-plugin-zoom\.js/,
                        enforce: true,
                        priority: 30,
                    },
                    vendors: {
                        name: "vendors",
                        test: /node_modules/,
                        enforce: true,
                        priority: 20,
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true,
                        enforce: true
                    },
                },
            },
            runtimeChunk: {
                name: 'runtime',
            },
            namedModules: true,
            namedChunks: true,
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
                title: 'overview',
                filename: 'overview.html',
                chunks: ['runtime', 'styles', 'vendors', 'common', 'overview'],
            }),
            new HtmlWebpackPlugin({
                title: 'dataset',
                filename: 'dataset.html',
                chunks: ['runtime', 'styles', 'vendors', 'vendors-chart', 'common', 'dataset'],
            }),
            new HtmlWebpackPlugin({
                title: 'register',
                filename: 'register.html',
                chunks: ['runtime', 'styles', 'vendors', 'common', 'register'],
            }),
            new HtmlWebpackPlugin({
                title: 'login',
                filename: 'login.html',
                chunks: ['runtime', 'styles', 'vendors', 'common', 'login'],
            }),
            new HtmlWebpackPlugin({
                title: 'set-form',
                filename: 'set-form.html',
                chunks: ['runtime', 'styles', 'vendors', 'common', 'set-form'],
            }),
            new HtmlWebpackPlugin({
                title: 'multi',
                filename: 'multi.html',
                chunks: ['runtime', 'styles', 'vendors', 'vendors-chart', 'common', 'multi'],
            }),
            new webpack.NamedModulesPlugin(),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        ]
    },
    utils.webmanifest(),
    utils.webFonts(),
    utils.exposeJQuery(),
    utils.favicon(),
    utils.loadJS({
        include: PATHS.app,
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

var prodConfig = merge([
    {
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: "/",
        },
        stats: {
            maxModules: Infinity,
            exclude: undefined,
            optimizationBailout: true,
        },
    },
    utils.minifyJS(),
    utils.extractCSS({
        use: [{
            loader: "css-loader",
            options: {
                sourceMap: true,
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
    utils.attachRevision(),
    utils.packtrackerUpload(),
]);

module.exports = mode => {
    // console.log('mode: ' + mode);
    // if(process.env.PT_PROJECT_TOKEN) {
    //     console.log('packtracker token exists');
    // }

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