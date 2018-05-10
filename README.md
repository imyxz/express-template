# Express-template

This is a template for express server.

## Features

1. Separate Model and Route

2. Auto generate url path and easy to inject middleware

3. Integrate `sequelize`

4. Support Hot Swapping for developing. You don't need to restart the whole server when updating `Route` and `Model`

## Tip

1. Hot swapping currently only support `Route` and `Model`, including `change`, `create` and `delete` files. Hot swapping of defination of tables are not supported yet. And Hot Swapping do not track updating required modules.