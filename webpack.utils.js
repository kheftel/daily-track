const webpack = require('webpack');
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const cssnano = require("cssnano");
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const PacktrackerPlugin = require('@packtracker/webpack-plugin');

exports.exposeJQuery = () => ({
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
        }]
    }
});

exports.favicon = () => ({
    module: {
        rules: [{
            test: /\.ico$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                },
            }]
        }]
    }
});

exports.emitCSS = ({
    include,
    exclude
} = {}) => ({
    module: {
        rules: [{
            test: /\.css$/,
            include,
            exclude,

            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    sourceMap: true,
                },
            }, {
                loader: "css-loader",
                options: {
                    sourceMap: true
                }
            }],
        }, ],
    },
});

exports.inlineCSS = ({
    include,
    exclude
} = {}) => ({
    module: {
        rules: [{
            test: /\.css$/,
            include,
            exclude,

            use: [{
                loader: "style-loader",
                options: {
                    sourceMap: true
                }
            }, {
                loader: "css-loader",
                options: {
                    sourceMap: true
                }
            }],
        }, ],
    },
});

exports.inlineLESS = ({
    include,
    exclude
} = {}) => ({
    module: {
        rules: [{
            test: /\.less$/,
            include,
            exclude,
            use: [{
                    loader: 'style-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'less-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        }]
    }
});

exports.extractCSS = ({
    include,
    exclude,
    use = []
}) => {
    // Output extracted CSS to a file
    const plugin = new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
    });

    return {
        module: {
            rules: [{
                test: /\.css$/,
                include,
                exclude,
                use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        sourceMap: true
                    }
                }].concat(use)
            }]
        },
        plugins: [plugin]
    };
};

exports.minifyCSS = ({
    options
}) => ({
    plugins: [
        new OptimizeCSSAssetsPlugin({
            cssProcessor: cssnano,
            cssProcessorOptions: options,
            canPrint: false,
        }),
    ],
});

exports.less = () => ({
    module: {
        rules: [{
            test: /\.less$/,
            use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: "postcss-loader",
                    options: {
                        plugins: () => [require("autoprefixer")()],
                    },
                },
                {
                    loader: 'less-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        }]
    }
});

exports.autoprefix = () => ({
    loader: "postcss-loader",
    options: {
        plugins: () => [require("autoprefixer")()],
    },
});

exports.loadImages = ({
    include,
    exclude,
    options
} = {}) => ({
    module: {
        rules: [{
            test: /\.(png|jpg|gif)$/,
            include,
            exclude,
            use: {
                loader: "url-loader",
                options,
            },
        }, ],
    },
});

exports.loadJS = ({
    include,
    exclude
} = {}) => ({
    module: {
        rules: [{
            test: /\.js$/,
            include,
            exclude,
            use: "babel-loader",
        }, ],
    },
});

exports.minifyJS = () => ({
    optimization: {
        minimizer: [new UglifyWebpackPlugin({
            sourceMap: true
        })],
    },
});

exports.generateSourceMaps = ({
    type
}) => ({
    devtool: type,
});

exports.attachRevision = () => ({
    plugins: [
        // new webpack.BannerPlugin({
        //     banner: new GitRevisionPlugin().version(),
        // }),
    ],
});

exports.packtrackerUpload = () => ({
    plugins: process.env.PT_PROJECT_TOKEN ? [new PacktrackerPlugin({
        project_token: process.env.PT_PROJECT_TOKEN,
        upload: true,
        // fail_build: true,
    })] : []
});