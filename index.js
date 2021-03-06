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
      if (key.match(/parent|scope/) || !node[key]) return;
      node[key].scope = node.scope;
      node[key].parent = node;
      traverse(node[key], cb);
    });
  }
};

function checkForDefinitions(node) {
  var checkFor = /\brequire\b|\bdefine\b|\bexports\b|\bmodule\b/,
    definitions = [];
  
  if (node.id && node.id.name.match(checkFor) && node.type.match(/VariableDeclarator|FunctionDeclaration|FunctionExpression/)) {
    definitions.push(node.id.name);
  }
  if (node.type && node.type.match(/FunctionDeclaration|FunctionExpression/)) {
    definitions = definitions.concat(
      node.params.filter(function(param) {
        return param.name.match(checkFor);
      }).map(function(param) {
        if (param.name === "require" && node.parent && node.parent.parent && node.parent.parent.callee && node.parent.parent.callee.name === "define") {
          return "CommonJSWrapper";
        } else {
          return param.name;
        }
      })
    );
  }

  return definitions.length ? definitions : false;
}

function checkForDependencies(node) {
  var callee = node.callee,
    type,
    deps = [],
    uses = [];

  if (node.type === "CallExpression" && 
    callee &&
    callee.type === "Identifier" &&
    callee.name.match(/\brequire\b|\bdefine\b/) &&
    node.arguments.length) {

    //require(id)
    if (callee.name === "require" && node.arguments.length === 1 && node.arguments[0].type !== "ArrayExpression") {
      if (node.arguments[0].type === "Literal") {
        type = node.scope.requireAsCommonJSWrapper ? "amd" : "commonJS";
        deps = [node.arguments[0].value];
      }
      uses.push("require (CommonJS)");
    //require([]) or define([]) or define(id, [])
    } else {
      type = "amd";
      node.arguments.every(function(arg) {
        if (arg && arg.type === "ArrayExpression") {
          deps = arg.elements.map(function(element) {
            return element.value;
          });
          return false;
        }

        return true;
      });

      if (callee.name === "define") {
        uses.push("define");
      } else if (callee.name === "require") {
        uses.push("require (AMD)");
      }
    }

    if (deps.length || uses.length) {
      return {
        type: type,
        deps: deps,
        uses: uses
      };
    }
  }

  return false;
}

function checkForModuleExportsUsage(node) {
  if (node.type === "AssignmentExpression") {
    if (node.left.object && node.left.property && node.left.object.name && node.left.object.name.match(/\bexports\b|\bmodule\b/)) {
      return node.left.object.name;
    }
  }
  return false;
}

module.exports = function(fileContents) {
  var deps = {
    commonJS: [],
    amd: []
  },
  defined = {},
  uses = {};

  // Take care of that nasty shebang
  fileContents = fileContents.replace(/^#![^\n]*\n/, "");

  traverse(esprima.parse(fileContents), function(node) {
    var checked;

    if (checked = checkForDependencies(node)) {
      checked.deps.forEach(function(dep) {
        deps[checked.type][dep] = true;
      });
      checked.uses.forEach(function(use) {
        uses[use] = true;
      });
    } else if (checked = checkForDefinitions(node)) {
      checked.forEach(function(definition) {
        if (definition === "CommonJSWrapper") {
          node.scope.requireAsCommonJSWrapper = true;
        } else {
          defined[definition] = true;
        }
      });
    } else if (checked = checkForModuleExportsUsage(node)) {
      uses[checked] = true;
    }
  });

  return {
    dependencies: {
      commonJS: Object.keys(deps.commonJS),
      amd: Object.keys(deps.amd)
    },
    defines: Object.keys(defined),
    uses: Object.keys(uses)
  }
};
