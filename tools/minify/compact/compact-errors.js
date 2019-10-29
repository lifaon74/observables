const $estraverse = require('estraverse');

function compactErrors(ast, strings) {
  $estraverse.traverse(ast, {
    enter(node, parent) {
      if (
        (node.type === 'Identifier')
        && node.name.endsWith('Error')
        && (parent.type === 'NewExpression')
      ) {
        parent.arguments = parent.arguments.map((argNode) => {
          switch (argNode.type) {
            case 'Literal': {
              if (typeof argNode.value === 'string') {
                return compactStringLiteral(parent.arguments[0], strings);
              }
              break;
            }
            case 'TemplateLiteral': {
              return compactTemplateLiteral(parent.arguments[0], strings);
            }
          }
          return argNode;
        });
      }
    }
  });

  return ast;
}

function compactStringLiteral(ast, strings) {
  if ((ast.type !== 'Literal') || (typeof ast.value !== 'string')) {
    throw new TypeError(`Expected string Literal`);
  }

  const id = strings.length;

  strings.push(
    ast.value
      .replace(/\$\{/g, '$\\{')
  );

  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'AsyncText'
    },
    arguments: [
      {
        type: 'Literal',
        value: id,
      }
    ]
  };
}

function compactTemplateLiteral(ast, strings) {
  if (ast.type !== 'TemplateLiteral') {
    throw new TypeError(`Expected TemplateLiteral`);
  }

  const id = strings.length;

  let str = '';
  for (let i = 0, l = ast.quasis.length; i < l; i++) {
    if (i > 0) {
      str += `\${ args[${ (i- 1) }] }`;
    }
    str += ast.quasis[i].value.raw;
  }

  strings.push(str);

  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'AsyncText'
    },
    arguments: [
      {
        type: 'Literal',
        value: id,
      },
      ...ast.expressions
    ]
  };
}

module.exports = compactErrors;




