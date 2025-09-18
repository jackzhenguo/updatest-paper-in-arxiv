
```shell
npm install --save-dev webpack webpack-cli ts-loader

npm install react react-dom typescript @types/react @types/react-dom

npm install tailwindcss postcss autoprefixer style-loader css-loader postcss-loader ts-loader webpack webpack-cli webpack-dev-server

npm install mini-css-extract-plugin --save-dev

npm install @react-oauth/google

npm install react-router-dom

npm install axios

```

Then run the following command to get the bundle.js file in the static folder.

```shell
npx webpack
```

Notes:

1. tailwind.config.js, content key specified the css pointers which pathes, which is very significant.

```
module.exports = {
  content: [
    './templates/**/*.html',  // For HTML files in your templates
    './templates/**/*.tsx',   // For JSX/TSX files where Tailwind is used
    './templates/**/*.ts',    // If you're using TypeScript files
  ],
```

## local 

```
npx webpack --no-cache
```

## export packages

```
npm init -y

npm install react react-router-dom lucide-react axios react-dom tailwindcss autoprefixer mini-css-extract-plugin

```
