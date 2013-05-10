var esprima = require("esprima");

function traverse(node, cb) {
  var scope;

  if (node.body) {
    scope = {};
    if (node.scope) {
      Object.keys(node.scope).forEach(function(key) {
        scope[key] = node.scope[key];
      });
    }
    node.scope = scope;
  }

  if (Array.isArray(node)) {
    node.forEach(function (x) {
      x.scope = node.scope;
      x.parent = node;
      traverse(x, cb);
    });
  } else if (node && typeof node === "object") {
    cb(node);

    Object.keys(node).forEach(function (key) {
      if (key.match(/parent|scope|defined/) || !node[key]) return;
      node[key].scope = node.scope;
      node[key].parent = node;
      traverse(node[key], cb);
    });
  }
};

function updateScopeIfIsADefinitionOf(node, checkFor) {
  var name,
      value;

  if (node.type === "FunctionExpression" && node.params.length) {
    node.params.forEach(function(param) {
      if (param.name.match(checkFor)) {
        //oh the horror. needs a visit from the refactor fairy.
        if (param.name === "require" && node.parent && node.parent.parent && node.parent.parent.callee && node.parent.parent.callee.name === "define") {
          value = "CommonJS Wrapper";
        } else {
          value = true;
        }
        name = param.name;
      }
    });
  } else if (node.type === "VariableDeclarator" && node.id && node.id.name.match(checkFor)) {
    name = node.id.name;
    value = true;
  }

  if (name && value) {
    node.scope[name] = value;
    return true;
  }

  return false;
}

function isRequirish(node) {
  var c = node.callee;
  return c
  && node.type === "CallExpression"
  && c.type === "Identifier"
  && c.name.match(/require|define/)
  && node.arguments.length
  && node.scope[c.name] !== true;
}

module.exports = function(fileContents) {
  var deps = {
    commonJS: [],
    amd: []
  };

  traverse(esprima.parse(fileContents), function(node) {
    if (isRequirish(node)) {
      //require(id)
      if (node.callee.name === "require" && node.arguments.length === 1 && node.arguments[0].type === "Literal") {
        deps[node.scope.require === "CommonJS Wrapper" ? "amd" : "commonJS"].push(node.arguments[0].value);
      //require([]) or define([]) or define(id, [])
      } else {
        node.arguments.every(function(arg) {
          if (arg && arg.type === "ArrayExpression") {
            arg.elements.forEach(function(element) {
              deps.amd.push(element.value);
            });
            return false;
          }
          return true;
        });
      }
    } else {
      updateScopeIfIsADefinitionOf(node, /require|define/);
    }
  });

  return {
    dependencies: deps
  };

};
