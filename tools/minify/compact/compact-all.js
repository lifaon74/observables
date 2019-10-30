const { parse, generate, log } = require('./compact-helpers');
const compactSymbols = require('./compact-symbols');
const compactErrors = require('./compact-errors');
const $path = require('path');
const $fs = require('fs');

// const a = `
//   function a() {
//     // const b = Symbol('my-symbol');
//     // throw new TypeError(\`a \${d} b \${e} c\`);
//     throw new TypeError(\`\${d} b \${e} c \\\${ args[2] } \\\\\${ args[3] } $\`);
//     throw new TypeError('a \\\\\${ args[2] }');
//     throw new TypeError('a \${ args[2] }');
//   }
// `;

// console.log(a);

// function loadStrings() {
//   return Promise.resolve(
//     [
//       '${ args[0] } b ${ args[1] } c \\${ args[2] } \\\\${ args[2] } $',
//       'a \\$\\{ args[2] }',
//       'a $\\{ args[2] }'
//     ]
//   );
// }

const url = '';
function loadStrings(url) {
  return fetch(url).then(_ => _.json());
}

function AsyncText(id) {
  var args = arguments;
  loadStrings(url)
    .then(function(strings) {
      var str = strings[id];
      str = str
        .replace(/\$\{ args\[(\d+)\] \}/g, function(match, argIndex, index) {
          var _str = str.slice(0, index);
          var i = 0;
          while (_str.endsWith('\\')) {
            i++;
            _str = _str.slice(_str, -1);
          }
          return ((i % 2) === 0) ? args[parseInt(argIndex) + 1] : match;
        })
        .replace(/\$\\{/g, '${');
      console.log('AsyncText #' + id + ': ' + str);
    });

  return ('#' + id);
}


// 363B minified + url length
// function generateAsyncText(url) {
//   return `(function(context, url) {
//     ${ loadStrings.toString() }
//     context.AsyncText = ${ AsyncText.toString() };
//   })(window, ${ JSON.stringify(url) });`
// }

/*
  TODO: should compact recurrent long properties
  var ObjectDefineProperty = Object.defineProperty;
  var ObjectCreate = Object.create;
  var ArrayIsArray = Array.isArray;
 */

function generateAsyncText(url, code) {
  return `(function(global, url) {
    global = global || self;
    ${ loadStrings.toString() }
    var AsyncText = ${ AsyncText.toString() };
    var TypeError = global.TypeError;
    var RangeError = global.RangeError;
    var Error = global.Error;
    
    ${ code }
  })(this, ${ JSON.stringify(url) });`
}


function compactAST(ast, url, strings) {
  // log(ast);

  compactSymbols(ast);

  const compactedErrorsAST = compactErrors(JSON.parse(JSON.stringify(ast)), strings);
  const compactedErrorsCode = generate(compactedErrorsAST);
  // const compactedCode = generate(ast);
  return generateAsyncText(url, compactedErrorsCode);
  // if (compactedCode.length <= (compactedErrorsCode.length + 363 + url.length)) {
  //   return compactedCode;
  // } else {
  //   return generateAsyncText(url) + compactedErrorsCode;
  // }
}

function compactCode(code, url, strings) {
  return compactAST(parse(code, url, strings));
}


function compact(sourcePath) {
  const strings = [];
  const dest = sourcePath.replace(/\.js$/, '.strings.json');

  const content = $fs.readFileSync(sourcePath, 'utf8');
  let ast;

  try {
    ast = parse(content);
  } catch (error) {
    console.log(`Unable to compact: ${ sourcePath }`);
    console.log(error);
    return content;
  }

  const code = compactAST(ast, `https://unpkg.com/browse/@lifaon/observables/bundles/${ $path.basename(dest) }`, strings);

  $fs.writeFileSync(dest, JSON.stringify(strings, null, 2), 'utf8');

  return code;
}





// const code = compactCode(a, 'hello-url');
// console.log(code);

// AsyncText(0, 'd', 'e', 'last');
// AsyncText(1, 'd', 'e', 'last');
// AsyncText(2, 'd', 'e', 'last');

// console.log(compact($path.join(__filename)));
// console.log(compact('C:\\workspace\\test\\observables\\dist\\global\\observables.core.umd.js'));


module.exports = {
  compact,
};
