const $estraverse = require('estraverse');

function compactSymbols(ast) {
  $estraverse.traverse(ast, {
    enter(node, parent) {
      if (
        (node.type === 'Identifier')
        && (node.name === 'Symbol')
        && (parent.type === 'CallExpression')
      ) {
        parent.arguments = [];
      }
    }
  });
  return ast;
}

module.exports = compactSymbols;




