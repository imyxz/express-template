# ROUTE
This directory contains your Application Routes.

This directory could have sub directories and the Loader will automatically load js files recurrently and add prefix to the URL of them with their path relative to Route dir.

In each directory if there is a route file named `index.js`, the other route files of the directory, including thoes in sub directories would "mount" under it.

So if you need to use middleware for a bundle of route files, you should define it in `index.js`

If the directory name starts with `_`, the loader will replace it with `:` and pass it to `express`, which makes you could set params in the url.

For example, the structure of the example is

```
| index.js
|- welcome.js
|- v1
|-- example.js
|-- :userId
|--- example.js
```

And have four accessible url:

1. `/`

2. `/vistors`

3. `/v1/date`

4. `/v1/:userId/space`

All of them has middleware defined in `/index.js`
