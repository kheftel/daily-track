const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './client/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
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
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [{
                    loader: 'style-loader' // creates style nodes from JS strings
                }, {
                    loader: 'css-loader' // translates CSS into CommonJS
                }, {
                    loader: 'less-loader' // compiles Less to CSS
                }]
            }, {
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
    plugins: [
        new webpack.ProvidePlugin({
            Chart: 'chart.js'
        }),
        new webpack.ProvidePlugin({
            moment: 'moment'
        })
    ]
};