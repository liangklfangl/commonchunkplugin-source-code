### 1.不添加commonchunkplugin打包的文件

我们的webpack配置如下：

```js
 var webpack = require('webpack');

module.exports = {
    entry:  {
         main:'./src/index.js',
         main1:'./src/index1.js'
    },
    output: {
        path:     'builds',
        filename: "[name].entry.chunk.js",
        publicPath: 'builds/',
    },
    plugins: [

    ],
    module: {
         loaders: [
         {
            test: /\.js$/,
             enforce: "pre",
             loader: "eslint-loader"
          },
           {
                test:    /\.js/,
                loader:  'babel-loader',
                include: __dirname + '/src',
            },
            {
                test:   /\.scss/,
                loader: 'style-loader!css-loader!sass-loader',
                // Or
               // loaders: ['style', 'css', 'sass'],
               //这里必须是loader后缀
            },
            {
                test:   /\.html/,
                loader: 'html-loader',
            }
        ],
    }
};
```

此时我们在build目录下生成如下的六个文件：

![](./1.png)

此时main和main1表示的都是入口文件打包的结果，而我们的其他文件都是通过require.ensure打包而成的。

### 2.添加commonchunkplugin打包的文件

更新webpack如下：

```js
var webpack = require('webpack');

module.exports = {
    entry:  {
         main:'./src/index.js',
         main1:'./src/index1.js'
    },
    output: {
        path:     'builds',
        // filename: '[chunkhash].output.js',
        filename: "[name].entry.chunk.js",
        publicPath: 'builds/',
    },
    plugins: [
         new webpack.optimize.CommonsChunkPlugin({
                // async: true,
                filename:'[name].bundle.js',
                children:true,
               //对main和main1的文件单独打包，main的chunks集合包含了两个文件，也就是require.ensure后的两个文件
                name:      ['main','main1'], // Move dependencies to our main file
                minChunks: 2, // How many times a dependency must come up before being extracted
            }),

    ],
    module: {
         loaders: [
         {
            test: /\.js$/,
             enforce: "pre",
             loader: "eslint-loader"
          },
           {
                test:    /\.js/,
                loader:  'babel-loader',
                include: __dirname + '/src',
            },
            {
                test:   /\.scss/,
                loader: 'style-loader!css-loader!sass-loader',
                // Or
               // loaders: ['style', 'css', 'sass'],
               //这里必须是loader后缀
            },
            {
                test:   /\.html/,
                loader: 'html-loader',
            }
        ],
    }
};
```

此时打包的结果为如下：

![](./2.png)

其中 name:['main','main1']的配置表示，我们的main和main1这两个chunk(entry中配置)对应的子chunk中公有的模块会被打包到一起，也就是打包到main.entry.chunk.js和main1.entry.chunk.js中，但是输出文件不再是main.entry.chunk.js和main1.entry.chunk.js，而是filename:'[name].bundle.js'，也就是最后生成的main.bundle.js和main1.bundle.js。

### 3.当配置children后我们抽取公共模块的chunks集合

这时候在插件commonChunkPlugin中的抽取公共chunk的代码:

```js
     commonChunks.forEach(function processCommonChunk(commonChunk, idx) {
                    let usedChunks;
                    if(Array.isArray(selectedChunks)) {
                        usedChunks = chunks.filter(chunk => chunk !== commonChunk && selectedChunks.indexOf(chunk.name) >= 0);
                    } else if(selectedChunks === false || asyncOption) {
                        usedChunks = (commonChunk.chunks || []).filter((chunk) => {
                            // we can only move modules from this chunk if the "commonChunk" is the only parent
                            return asyncOption || chunk.parents.length === 1;
                        });
                     
                     //(1)
                     var util = require('util'); 
                    console.log('------------->commonChunk',util.inspect(commonChunk, {showHidden:true,depth:4})); 
                    //如果name=［'main','main1'］那么表示以入口文件开始单独打包，此时的commonChunk就是我们的main.js和main1.js
                    //其chunks属性表示所有require.ensure的产生的chunk
                    } else {
                        if(commonChunk.parents.length > 0) {
                            compilation.errors.push(new Error("CommonsChunkPlugin: While running in normal mode it's not allowed to use a non-entry chunk (" + commonChunk.name + ")"));
                            return;
                        }
                        usedChunks = chunks.filter((chunk) => {
                            const found = commonChunks.indexOf(chunk);
                            if(found >= idx) return false;
                            return chunk.hasRuntime();
                        });
                    }
                    let asyncChunk;
                    if(asyncOption) {
                        asyncChunk = compilation.addChunk(typeof asyncOption === "string" ? asyncOption : undefined);
                        asyncChunk.chunkReason = "async commons chunk";
                        asyncChunk.extraAsync = true;
                        asyncChunk.addParent(commonChunk);
                        commonChunk.addChunk(asyncChunk);
                        commonChunk = asyncChunk;
                    }
                    const reallyUsedModules = [];
                    if(minChunks !== Infinity) {
                        const commonModulesCount = [];
                        const commonModules = [];
                        usedChunks.forEach((chunk) => {
                            chunk.modules.forEach((module) => {
                                const idx = commonModules.indexOf(module);
                                if(idx < 0) {
                                    commonModules.push(module);
                                    commonModulesCount.push(1);
                                } else {
                                    commonModulesCount[idx]++;
                                }
                            });
                        });
                        const _minChunks = (minChunks || Math.max(2, usedChunks.length));
                        commonModulesCount.forEach((count, idx) => {
                            const module = commonModules[idx];
                            if(typeof minChunks === "function") {
                                if(!minChunks(module, count))
                                    return;
                            } else if(count < _minChunks) {
                                return;
                            }
                            if(module.chunkCondition && !module.chunkCondition(commonChunk))
                                return;
                            reallyUsedModules.push(module);
                        });
                    }
                    if(minSize) {
                        const size = reallyUsedModules.reduce((a, b) => {
                            return a + b.size();
                        }, 0);
                        if(size < minSize)
                            return;
                    }
                    const reallyUsedChunks = new Set();
                    reallyUsedModules.forEach((module) => {
                        usedChunks.forEach((chunk) => {
                            if(module.removeChunk(chunk)) {
                                reallyUsedChunks.add(chunk);
                            }
                        });
                        commonChunk.addModule(module);
                        module.addChunk(commonChunk);
                    });
                    if(asyncOption) {
                        for(const chunk of reallyUsedChunks) {
                            if(chunk.isInitial()) continue;
                            chunk.blocks.forEach((block) => {
                                block.chunks.unshift(commonChunk);
                                commonChunk.addBlock(block);
                            });
                        }
                        asyncChunk.origins = Array.from(reallyUsedChunks).map((chunk) => {
                            return chunk.origins.map((origin) => {
                                const newOrigin = Object.create(origin);
                                newOrigin.reasons = (origin.reasons || []).slice();
                                newOrigin.reasons.push("async commons");
                                return newOrigin;
                            });
                        }).reduce((arr, a) => {
                            arr.push.apply(arr, a);
                            return arr;
                        }, []);
                    } else {
                        usedChunks.forEach((chunk) => {
                            chunk.parents = [commonChunk];
                            chunk.entrypoints.forEach((ep) => {
                                ep.insertChunk(commonChunk, chunk);
                            });
                            commonChunk.addChunk(chunk);
                        });
                    }
                    if(filenameTemplate)
                        commonChunk.filenameTemplate = filenameTemplate;
                });
```

#### 3.1 commonChunkPlugin抽取之前的chunk

在(1)处，仅仅表示我们自己的main或者main1这个chunk的基本信息，包括modules等，还没有经过commonChunkPlugin进行抽取，具体内容参见data.js。

其中chunk的内部结构如下：

```js
Chunk {
  id: null,
  ids: null,
  debugId: 1000,
  name: 'main',
  //chunk对应的name
  modules: [],
  //该chunk来自于哪些module,main这个chunk来自于src/index.js,该module包含两个RequireEnsureDependenciesBlock
  entrypoints: 
   [ Entrypoint { name: 'main', chunks: [ [Circular], [length]: 1 ] },
     [length]: 1 ],
  //入口文件为main:'./src/index.js',而entryPoint对应的chunk为对当前chunk的循环引用
 chunks:[],//当前chunk的子级chunks有哪些，如require.ensure都是当前chunk的子级chunk
 parents: [ [length]: 0 ],
 //当前chunk的父级chunk集合，没有经过commonChunkPlugin处理main是顶级chunk
 blocks: [ [length]: 0 ],
 //module.blocks表示模块包含的块RequireEnsureDependenciesBlock等的个数，chunk.block表示当前chunk包含的block的个数
 origins: 
 //当前chunk从哪些模块得到
   [ { module: 
        NormalModule {
          dependencies: [ [Object], [length]: 1 ],
          blocks: [ [Object], [Object], [length]: 2 ],
          variables: [ [length]: 0 ],
          context: '/Users/klfang/Desktop/webpack-chunkfilename/src',
          reasons: [ [length]: 0 ],
          debugId: 1000,
          lastId: null,
          id: null,
          portableId: null,
          index: 0,
          index2: 12,
          depth: 0,
          used: true,
          usedExports: true,
          providedExports: true,
          chunks: [ [Circular], [length]: 1 ],
          warnings: [ [Object], [length]: 1 ],
          dependenciesWarnings: [ [length]: 0 ],
          errors: [ [length]: 0 ],
          dependenciesErrors: [ [length]: 0 ],
          strict: true,
          meta: {},
          request: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/babel-loader/lib/index.js!/Users/klfang/Desktop/webpack-chunkfilename/node_modules/eslint-loader/index.js!/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
          userRequest: '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
          rawRequest: './src/index.js',
          parser: 
           Parser {
             _plugins: [Object],
             options: undefined,
             scope: undefined,
             state: undefined },
          resource: '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
          loaders: [ [Object], [Object], [length]: 2 ],
          //module.fileDependencies: An array of source file paths included into a module. This includes the source JavaScript file itself (ex: index.js), and all dependency asset files (stylesheets, images, etc) that it has required. Reviewing dependencies is useful for seeing what source files belong to a module.
          //这个module没有引入相应的css/html/image等
          fileDependencies: 
           [ '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
             [length]: 1 ],
          contextDependencies: [ [length]: 0 ],
          error: null,
          _source: 
           OriginalSource {
             _value: '\'use strict\';\n\n// var $ = require(\'jquery\');\n\n// $(\'body\').html(\'Hello\');\n\n\n// import $ from \'jquery\';\n// $(\'body\').html(\'Hello\');\n\n\n// import Button from \'./Components/Button\';\n// const button = new Button(\'google.com\');\n//  button.render(\'a\');\n\n//code splitting\nif (document.querySelectorAll(\'a\').length) {\n    require.ensure([], function () {\n        var Button = require(\'./Components/Button\').default;\n        var button = new Button(\'google.com\');\n        button.render(\'a\');\n    });\n}\n\nif (document.querySelectorAll(\'h1\').length) {\n    require.ensure([], function () {\n        var Header = require(\'./Components/Header\').default;\n        new Header().render(\'h1\');\n    });\n}',
             _name: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/babel-loader/lib/index.js!/Users/klfang/Desktop/webpack-chunkfilename/node_modules/eslint-loader/index.js!/Users/klfang/Desktop/webpack-chunkfilename/src/index.js' },
          assets: {},
          built: true,
          _cachedSource: null,
          issuer: null,
          building: undefined,
          buildTimestamp: 1487137260364,
          cacheable: true },
       loc: undefined,
       name: 'main' },
     [length]: 1 ],
  files: [ [length]: 0 ],
  // An array of output filenames generated by the chunk. 
  //You may access these asset sources from the compilation.assets table.
  //表示这个chunk产生的输出文件，此处为顶级chunk没有输出文件产生
  _removeAndDo:{},
  addChunk:{},
  addParent:{},
  //入口模块
  entryModule: 
   NormalModule {
     dependencies: 
      [ ConstDependency {},
        [length]: 1 ],
     blocks: 
      [ RequireEnsureDependenciesBlock {
          dependencies: [ [Object], [Object], [Object], [length]: 3 ],
          blocks: [ [length]: 0 ],
          variables: [ [length]: 0 ],
          chunkName: null,
          chunks: [ [Object], [length]: 1 ],
          module: [Circular],
          loc: SourceLocation { start: [Object], end: [Object] },
          expr: 
           Node {
             type: 'CallExpression',
             start: 313,
             end: 488,
             loc: [Object],
             range: [Object],
             callee: [Object],
             arguments: [Object] },
          range: [ 345, 486, [length]: 2 ],
          chunkNameRange: null,
          parent: [Circular] },
        RequireEnsureDependenciesBlock {
          dependencies: [ [Object], [Object], [Object], [length]: 3 ],
          blocks: [ [length]: 0 ],
          variables: [ [length]: 0 ],
          chunkName: null,
          chunks: [ [Object], [length]: 1 ],
          module: [Circular],
          loc: SourceLocation { start: [Object], end: [Object] },
          expr: 
           Node {
             type: 'CallExpression',
             start: 543,
             end: 678,
             loc: [Object],
             range: [Object],
             callee: [Object],
             arguments: [Object] },
          range: [ 575, 676, [length]: 2 ],
          chunkNameRange: null,
          parent: [Circular] },
        [length]: 2 ],
     variables: [ [length]: 0 ],
     context: '/Users/klfang/Desktop/webpack-chunkfilename/src',
     reasons: [ [length]: 0 ],
     debugId: 1000,
     lastId: null,
     id: null,
     portableId: null,
     index: 0,
     index2: 12,
     depth: 0,
     used: true,
     usedExports: true,
     providedExports: true,
     chunks: [ [Circular], [length]: 1 ],
     warnings: [],
     dependenciesWarnings: [ [length]: 0 ],
     errors: [ [length]: 0 ],
     dependenciesErrors: [ [length]: 0 ],
     strict: true,
     meta: {},
     request: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/babel-loader/lib/index.js!/Users/klfang/Desktop/webpack-chunkfilename/node_modules/eslint-loader/index.js!/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
     userRequest: '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
     rawRequest: './src/index.js',
     parser: 
      Parser {
        _plugins: {},
        options: undefined,
        scope: undefined,
        state: undefined },
     resource: '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
     loaders: 
      [ { loader: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/babel-loader/lib/index.js' },
        { loader: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/eslint-loader/index.js' },
        [length]: 2 ],
     fileDependencies: 
      [ '/Users/klfang/Desktop/webpack-chunkfilename/src/index.js',
        [length]: 1 ],
     contextDependencies: [ [length]: 0 ],
     error: null,
     _source: 
      OriginalSource {
        _value: '\'use strict\';\n\n// var $ = require(\'jquery\');\n\n// $(\'body\').html(\'Hello\');\n\n\n// import $ from \'jquery\';\n// $(\'body\').html(\'Hello\');\n\n\n// import Button from \'./Components/Button\';\n// const button = new Button(\'google.com\');\n//  button.render(\'a\');\n\n//code splitting\nif (document.querySelectorAll(\'a\').length) {\n    require.ensure([], function () {\n        var Button = require(\'./Components/Button\').default;\n        var button = new Button(\'google.com\');\n        button.render(\'a\');\n    });\n}\n\nif (document.querySelectorAll(\'h1\').length) {\n    require.ensure([], function () {\n        var Header = require(\'./Components/Header\').default;\n        new Header().render(\'h1\');\n    });\n}',
        _name: '/Users/klfang/Desktop/webpack-chunkfilename/node_modules/babel-loader/lib/index.js!/Users/klfang/Desktop/webpack-chunkfilename/node_modules/eslint-loader/index.js!/Users/klfang/Desktop/webpack-chunkfilename/src/index.js' },
     assets: {},
     built: true,
     _cachedSource: null,
     issuer: null,
     building: undefined,
     buildTimestamp: 1487137260364,
     cacheable: true } }
}
```

#### 3.2 commonChunkPlugin抽取公共代码抽取可视化

运行[commonsChunkPlugin_Config](https://github.com/liangklfangl/commonsChunkPlugin_Config/tree/master/example3)中的example3代码,其中webpack的配置如下：

```js
 var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
 module.exports = {
     entry: {
         main: process.cwd()+'/example3/main.js',
        main1: process.cwd()+'/example3/main1.js',
         common1:["jquery"],
         common2:["vue"]
     },
     output: {
         path: process.cwd()+'/dest/example3',
         filename: '[name].js'
    },
     plugins: [
         new CommonsChunkPlugin({
             name: ["chunk",'common1','common2'],
             minChunks:2
         })
     ]
 };
```

我们看看commonchunkplugin中的处理方式(else部分)：

```js
    if(Array.isArray(selectedChunks)) {
          usedChunks = chunks.filter(function(chunk) {
            if(chunk === commonChunk) return false;
            //此时commonChunk的内容是已经存在于最终的文件中了，如果它不是手动创建的chunk
            //去掉下例的jquery,得到usedChunks集合
            return selectedChunks.indexOf(chunk.name) >= 0;
          });
        } else if(selectedChunks === false || asyncOption) {
          usedChunks = (commonChunk.chunks || []).filter(function(chunk) {
            // we can only move modules from this chunk if the "commonChunk" is the only parent
            //只是把一级子chunk的公共内容提取出来，如果有一个子chunk的父级chunk有两个那么不会被提取出来。
            return asyncOption || chunk.parents.length === 1;
          });
        } else {
          //如果当前的这个chunk有多个父级chunk，那么不会提取的
          if(commonChunk.parents.length > 0) {
            compilation.errors.push(new Error("CommonsChunkPlugin: While running in normal mode it's not allowed to use a non-entry chunk (" + commonChunk.name + ")"));
            return;
          }
          usedChunks = chunks.filter(function(chunk) {
            var found = commonChunks.indexOf(chunk);
            if(found >= idx) return false;
            return chunk.hasRuntime();
          });
        }
```
















