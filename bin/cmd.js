#!/usr/bin/env node

console.log(require("../")(require("fs").readFileSync(process.argv[2])));
