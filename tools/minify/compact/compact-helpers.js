const $esprima = require('esprima');
const $escodegen = require('escodegen');
const $fs = require('fs');

function parse(code) {
  return $esprima.parseScript(code);
}

function parseFile(sourcePath) {
  return parse($fs.readFileSync(sourcePath, 'utf8'));
}

function generate(ast) {
  return $escodegen.generate(ast);
}

function generateFile(sourcePath, ast) {
  $fs.writeFileSync(sourcePath, generate(ast), 'utf8');
}

function log(value) {
  const util = require('util');
  console.log(util.inspect(value, false, null, true));
}


module.exports = {
  parse,
  parseFile,
  generate,
  generateFile,
  log
};
