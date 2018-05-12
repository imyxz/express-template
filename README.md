# Express-template

This is a template for express server.

## Features

1. Separate Model and Route

2. Auto generate url path and easy to inject middleware

3. Integrate `sequelize`

4. Support Hot Swapping for developing. You don't need to restart the whole server when updating `Route` and `Model`

## Tip

1. Hot swapping currently only support `Route` and `Model`, including `change`, `create` and `delete` files. Hot swapping of defination of tables are not supported yet.

2. For modules those require in `Route` and `Model` and only export an Object, you could use `watchRequire` to enable hot swapping for the module. Otherwise the loader would not trace the updating of the required module.

3. You could use `_require` to require module with path relative to the root directory of the project by using `~` prefix, so does `watchRequire`