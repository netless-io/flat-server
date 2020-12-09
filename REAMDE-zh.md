# flat-server

此项目是 [flat-desktop](https://github.com/netless-io/flat-desktop) 所搭配使用的后端

### 功能介绍

* 微信注册、登陆

### 搭建指南

你可以 `Fork` 此项目，然后在 `https://github.com/你的用户名/flat-server/settings/secrets/actions` 中添加一些私有变量。

其中变量列表为:

|  变量名   | 描述  |
|  ----  | ----  |
| DOCKERHUB_USERNAME | 你的 [hub.docker.com](https://hub.docker.com) 的账户名 |
| DOCKERHUB_TOKEN    | 在 hub.docker 的 [设置页面](https://hub.docker.com/settings/security) 生成的 `token` |
| SERVER_PORT        | 服务部署好后，需要公开暴露的端口 |
| WECHAT_APP_ID      | 在 [微信开放平台](https://open.weixin.qq.com/) 中 `网站应用` 里的 `AppID` |
| WECHAT_APP_SECRET  | 在 [微信开放平台](https://open.weixin.qq.com/) 中 `网站应用` 里的 `AppSecret` |
| REDIS_HOST         | redis 连接地址 |
| REDIS_PORT         | redis 连接端口 |
| REDIS_PASSWORD     | redis 连接密码 |
| REDIS_DB           | redis 连接 `db` 名 |
| MYSQL_HOST         | MySQL 连接地址 |
| MYSQL_PORT         | MySQL 连接端口 |
| MYSQL_USER         | MySQL 用户名 |
| MYSQL_PASSWORD     | MySQL 密码 |
| MYSQL_DB           | MySQL 要连接的数据库名 |
| SSH_HOST           | 部署的 SSH 地址 |
| SSH_USERNAME       | SSH 用户名 |
| SSH_KEY            | SSH 秘钥 |
| SSH_PORT           | SSH 连接端口 |

其中需要注意的一点是: `SSH_KEY`

这个是由 `ssh-keygen -t rsa -b 4096` 生成的秘钥（以: `-----BEGIN OPENSSH PRIVATE KEY-----` 开头）。

然后需要进入到服务器里，把 `ssh` 公钥追加到 ` ~/.ssh/authorized_keys` 里即可

### 技术选型

* [Node.js](https://github.com/nodejs/node)
* [TypeScript](https://github.com/microsoft/TypeScript)
* [MySQL](https://github.com/mysql/mysql-server)
* [Redis](https://github.com/redis/redis)
* [Restify](https://github.com/restify/node-restify)
* [Socket.IO](https://github.com/socketio/socket.io)
