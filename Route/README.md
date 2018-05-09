# ROUTE
This directory contains your Application Routes.

This directory could have sub directories and the Loader will automatically load js files recurrently and add prefix to the URL of them with their path relative to Route dir.

In each directory if there is a route file named `index.js`, the other route files of the directory, including thoes in sub directories would "mount" under it.

So if you need to use middleware for a bundle of route files, you should define it in `index.js`

For example, the structure of the example is

```
| index.js
|- welcome.js
|- v1
|--- example.js
```

And have three accessible url:

1. `/`

2. `/vistors`

3. `/v1/date`

All of them has middleware defined in `/index.js`
