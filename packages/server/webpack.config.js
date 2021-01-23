const path = require('path')
const Nodemon = require('nodemon-webpack-plugin')

module.exports = {
	name: 'server',
	mode: 'development',
	performance: {
		hints: false,
	},
	optimization: {
		minimize: false,
	},
	entry: {
		index: path.resolve(process.cwd(), 'src', 'index.ts'),
	},
	plugins: [
		new Nodemon()
	],
	node: {
		__dirname: false,
	},
	resolve: {
		extensions: ['.js', '.ts'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader'
			},
		],
	},
	target: 'node',
	externals:['express', 'express-ws'],
	output: {
		filename: 'main.js',
		path: path.resolve(process.cwd(), 'dist'),
		libraryTarget: 'commonjs',
	},
}