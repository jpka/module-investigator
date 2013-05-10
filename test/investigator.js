var chai = require("chai"),
    expect = chai.expect,
    should = chai.should(),
    investigator = require("../index.js"),
    fixture = function(id) {
      return require("fs").readFileSync(require("path").join(__dirname, "fixtures", id + ".js"), "utf8");
    },
    deps = ["a", "b", "c"];

describe("Investigator's", function() {

  it("correctly obtains CommonJS dependencies", function() {
    expect(investigator(fixture("cjs-deps")).dependencies.commonJS).to.deep.equal(deps);
  });

  /*
  it("avoids CommonJS false positives when require is defined as a declared variable in the context it is used", function() {
    expect(investigator(fixture("defined-variable-require-cjs-deps")).dependencies.commonJS).to.be.empty;
  });

  it("avoids CommonJS false positives when require is defined as a function parameter in the context it is used", function() {
    expect(investigator(fixture("function-parameter-require-cjs-deps")).dependencies.commonJS).to.be.empty;
  });

  it("avoids CommonJS false positives when require is defined as a function in the context it is used", function() {
    expect(investigator(fixture("defined-function-require-cjs-deps")).dependencies.commonJS).to.be.empty;
  });
  */

  it("correctly obtains AMD dependencies from an anonymous module", function() {
    expect(investigator(fixture("anonymous-amd-deps")).dependencies.amd).to.deep.equal(deps);
  });

  it("correctly obtains AMD dependencies from a named module", function() {
    expect(investigator(fixture("named-amd-deps")).dependencies.amd).to.deep.equal(deps);
  });

  it("correctly obtains AMD dependencies from a call to require([])", function() {
    expect(investigator(fixture("require-amd-deps")).dependencies.amd).to.deep.equal(deps);
  });

  it("correctly obtains AMD dependencies from a simplified CommonJS wrapper", function() {
    expect(investigator(fixture("wrapped-amd-deps")).dependencies.amd).to.deep.equal(deps);
  });

});
