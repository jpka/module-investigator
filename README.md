Collects information about module format adherence (AMD/CommonJS) and dependencies in one AST parse. 

# usage

Just feed it the source

``` js
var investigator = require("module-investigator");
investigator(fileSrc);
```

or

```
investigate path/to/file
```
