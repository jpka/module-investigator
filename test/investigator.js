var chai = require("chai"),
    expect = chai.expect,
    should = chai.should(),
    investigator = require("../index.js"),
    fixture = function(id) {
      return require("fs").readFileSync(require("path").join(__dirname, "fixtures", id + ".js"), "utf8");
    },
    deps = ["a", "b", "c"];

describe("Investigator", function() {

  it("correctly obtains CommonJS dependencies", function() {
    expect(investigator(fixture("cjs-deps")).dependencies.commonJS).to.deep.equal(deps);
  });

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

  it("correctly obtains AMD and CommonJS dependencies from a hybrid module", function() {
    expect(investigator(fixture("hybrid")).dependencies.amd).to.deep.equal(deps);
    expect(investigator(fixture("hybrid")).dependencies.commonJS).to.deep.equal(["d", "e", "f"]);
  });

  it("reports when exports, module, define and require are defined in-module", function() {
    expect(investigator(fixture("defines")).defines.sort()).to.deep.equal(["exports", "module", "define", "require"].sort());
  });

  it("reports when exports, module, define and require are used", function() {
    expect(investigator(fixture("uses")).uses.sort()).to.deep.equal(["exports", "module", "define", "require (AMD)", "require (CommonJS)"].sort());
  });

});
