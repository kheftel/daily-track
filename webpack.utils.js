const MiniCssExtractPlugin = require("mini-css-extract-plugin");

exports.extractCSS = ({
    include,
    exclude,
    use = []
}) => {
    // Output extracted CSS to a file
    const plugin = new MiniCssExtractPlugin({
        filename: "[name].[contenthash:4].css",
    });

    return {
        module: {
            rules: [{
                test: /\.css$/,
                include,
                exclude,

                use: [MiniCssExtractPlugin.loader].concat(use),
            }, ],
        },
        plugins: [plugin],
    };
};

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
            test: /img\/.+\.(png|jpg|gif)$/,
            include,
            exclude,
            use: {
                loader: "url-loader",
                options,
            },
        }, ],
    },
});