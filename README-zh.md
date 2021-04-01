flat-server 是 [Flat 跨平台开源教室](https://github.com/netless-io/flat) 搭配使用的 `Node.js` 后端。主要是用于响应 Flat 前端的请求：


## 特性

- 用户管理
  - [x] 微信登陆
  - [ ] Github 登陆
  - [ ] 谷歌登陆
- 房间管理
  - [x] 预定房间
  - [x] 周期性房间
- [x] 互动白板、实时音视频（RTC）、即时消息（RTM）签名鉴权
- [x] 云端录制回放
- [ ] 多媒体课件云存储（云盘）


## 本地开发

通过以下方式可以让 flat-server 在本地中运行起来：


### 安装

1. 因涉及到 Github Action 等配置，请先右上方 <kbd>Fork</kbd> 此项目，然后再 `git clone` fork 出来的项目克隆到本地。
2. 在项目根目录执行：
   ```shell
   yarn install --frozen-lockfile
   ```


### 配置环境变量


1. 创建两个文件 `config/.env.development.local` 和 `config/.env.production.local`
1. 按照文件 `config/.env.default` 的格式添加环境变量。变量值含义参考下方[环境变量值参考](#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%80%BC%E5%8F%82%E8%80%83)。

- 环境变量值可参考下方: [环境变量值参考](#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%80%BC%E5%8F%82%E8%80%83)。
- 关于 _.env.*_ 命名规范可参看: [Files under version control](https://github.com/kerimdzhanov/dotenv-flow#files-under-version-control)


### 配置 MySQL、Redis

1. 如果没有远程的 MySQL 或 Redis ，请先在本地安装 _Docker。_
1. 安装好 _Docker_ 之后，选一个合适的位置创建一个文件夹，如: `mkdir -p ~/Data/Docker/MySQL ~/Data/Docker/Redis`
1. 根据上一步 _.env.* _文件中_ _MySQL_ _和_ _Redis 相关的值来配置，比如以下方 _.env.*_ 配置为例：

```typescript
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=你的自定义 Redis 密码
REDIS_DB=0(你也可以选择其他的 db)

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的自定义 MySQL 密码
MYSQL_DB=你自定义的表名(推荐是: flat_server)
```


#### MySQL

1. 控制台中输入：（注意末尾的分号不能删去）
   ```shell
   cd ~/Data/Docker/MySQL
   docker run -dit -p 3306:3306 --name mysql --restart always -v `pwd`/data:/var/lib/mysql -v `pwd`/conf.d:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=你在env里MYSQL_PASSWORD所填写的值  mysql
   docker exec -it mysql bash
   mysql -uroot -p 你在env里MYSQL_PASSWORD所填写的值
   CREATE DATABASE 你在env里MYSQL_DB所填写的值;
   ```
2. 在项目 `src/v1/thirdPartyService/TypeORMService.ts` 的 `createConnection` 配置参数对象中，添加属性: `synchronize: true`。这个选项是为了同步数据库表、字段到数据库中。
3. 执行 `node ./dist/index.js`。
4. 执行完成后，删除 `synchronize: true`。这个属性只有修改了数据库字段信息的时候才会需要。


#### Redis

打开控制台输入：

```shell
cd ~/Data/Docker/Redis
docker run -dit -p 6379:6379 --name redis -v `pwd`/data:/data -v `pwd`/conf:/usr/local/etc/redis --restart always redis --requirepass "你在env里REDIS_PASSWORD所填写的值"
```


### 运行项目

1. 项目根目录执行：
   ```shell
   yarn run start
   ```
2. 打开另一个控制台，执行：
   ```shell
   node ./dist/index.js
   ```

如果启动成功，那么控制台应该会出现 `ready on http://0.0.0.0:80`。


## 部署

本地开发不需要部署。如果需要上线，依据你习惯的方式部署，比如通过 Github Action：

1. 如前面 fork 的仓库名为 `你的用户名/flat-server` 在 `https://github.com/你的用户名/flat-server/settings/secrets/actions` 中添加上面 .env.* 同样的内容。
2. 同时额外加上下方 [环境变量值参考](#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%80%BC%E5%8F%82%E8%80%83) 末尾的 `DOCKERHUB_*`、`SSH_*` 内容。


## 环境变量值参考

| 变量名                               | 描述                                 |  备注                                         |
| ----------------------------------- | ----------------------------------- | -------------------------------------------- |
| SERVER_PORT                         | 服务公开暴露的端口                     |  如 `8087`                                    |
| REDIS_HOST                          | Redis 连接地址                       |  如 `127.0.0.1`                               |
| REDIS_PORT                          | Redis 连接端口                       |  如 `6379`                                    |
| REDIS_PASSWORD                      | Redis 连接密码                       |                                               |
| REDIS_DB                            | Redis 连接 `db` 名                   |  如 `0`                                       |
| MYSQL_HOST                          | MySQL 连接地址                       |  如 `127.0.0.1`                               |
| MYSQL_PORT                          | MySQL 连接端口                       |  如 `3306`                                    |
| MYSQL_USER                          | MySQL 用户名                         |  如 `root`                                    |
| MYSQL_PASSWORD                      | MySQL 密码                           |                                               |
| MYSQL_DB                            | MySQL 要连接的数据库名                 | 推荐: `flat_server`                           |
| JWT_SECRET                          | JWT 秘钥                             |                                               |
| JWT_ALGORITHMS                      | JWT 加密算法                          | 见: [Algorithms supported][jwt-crypto]        |
| CLOUD_STORAGE_CONCURRENT            | 云存储(云盘)的并发量                    | 即: 同一时间只能上传多少个文件数(默认: 3)           |
| CLOUD_STORAGE_SINGLE_FILE_SIZE      | 云存储(云盘)上传文件时，单个文件的最大大小 | 默认: 500M                                     |
| CLOUD_STORAGE_TOTAL_SIZE            | 云存储(云盘)总量的最大大小              | 默认: 2G                                       |
| CLOUD_STORAGE_PREFIX_PATH           | 云存储(云盘)上传路径的前缀              | 默认: cloud-storage，前后不能有 `/`               |
| CLOUD_STORAGE_ALLOW_FILE_SUFFIX     | 云存储(云盘)支持上传的文件后缀           |                                                |
| WECHAT_APP_ID                       | [微信开放平台][open-wechat] App ID    | 见 `网站应用` 里 `AppID`                          |
| WECHAT_APP_SECRET                   | [微信开放平台][open-wechat] App 密钥   | 见 `网站应用` 里 `AppSecret`                       |
| AGORA_APP_ID                        | Agora App ID                        | 用于 RTC 与 RTM。见: [Use an App ID for authentication][agora-app-id-auth]    |
| AGORA_APP_CERTIFICATE               | Agora App Certificate               | 见: [Enable the App Certificate][agora-app-auth]             |
| AGORA_RESTFUL_ID                    | Agora RESTful ID                    | 用于课程回放。见: [Restful Authentication][agora-restful-auth]            |
| AGORA_RESTFUL_SECRET                | Agora RESTful Secret                | 见: [Restful Authentication][agora-restful-auth]             |
| AGORA_OSS_VENDOR                    | Agora 云端录制 OSS 配置               |  用于云端录制存储用户音视频。见: [Cloud Recording Start][cloud-recording] -> Schema -> clientRequest -> storageConfig   |
| AGORA_OSS_ACCESS_KEY_ID             | Agora 云端录制 OSS 配置               |  同上                                            |
| AGORA_OSS_ACCESS_KEY_SECRET         | Agora 云端录制 OSS 配置               |  同上                                            |
| AGORA_OSS_REGION                    | Agora 云端录制 OSS 配置               |  同上                                            |
| AGORA_OSS_BUCKET                    | Agora 云端录制 OSS 配置               |  同上                                            |
| AGORA_OSS_FOLDER                    | Agora 云端录制 OSS 配置               |  同上                                            |
| AGORA_OSS_PREFIX                    | Agora 云端录制 OSS 配置               |  同上                                            |
| NETLESS_ACCESS_KEY                  | Netless 白板 AK                     | 见: [Projects and permissions][netless-auth]     |
| NETLESS_SECRET_ACCESS_KEY           | Netless 白板 SK                     | 见: [Projects and permissions][netless-auth]     |
| ALIBABA_CLOUD_OSS_ACCESS_KEY        | 阿里云 OSS AK                        | 用于存储多媒体课件资源。见: [访问秘钥][ali-secret]     |
| ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET | 阿里云 OSS SK                        | 同上                                             |
| ALIBABA_CLOUD_OSS_BUCKET            | 阿里云 OSS bucket                    | 见: [存储空间][ali-bucket]                         |
| ALIBABA_CLOUD_OSS_REGION            | 阿里云 OSS region                    | 见: [地域][ali-region]                            |


如果需要远程部署，需额外添加以下变量

| 变量名                               | 描述                                                     |         备注              |
| ----------------------------------- | ------------------------------------------------------- | ------------------------- |
| DOCKERHUB_USERNAME                  | 你的 [hub.docker.com][docker] 的账户名                    |                           |
| DOCKERHUB_TOKEN                     | 在 hub.docker 的 [设置页面][docker-setting] 生成的 `token` |                           |
| SSH_HOST                            | 部署的 SSH 地址                                           |                           |
| SSH_USERNAME                        | SSH 用户名                                               |                           |
| SSH_KEY                             | SSH 秘钥                                                 |  由 `ssh-keygen -t rsa -b 4096` 生成的秘钥（以: `-----BEGIN OPENSSH PRIVATE KEY-----` 开头）。然后需要进入到服务器里，把 ssh 公钥追加到 `~/.ssh/authorized_keys` 里  |
| SSH_PORT                            | SSH 连接端口                                              |                           |

[ali-secret]: https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-zzk-f64-fdh
[ali-bucket]: https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-iiy-4uv-rb4
[ali-region]: https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-3qf-u3w-nsp

[netless-auth]: https://docs.agora.io/cn/whiteboard/generate_whiteboard_token_at_app_server?platform=RESTful

[jwt-crypto]: https://github.com/auth0/node-jsonwebtoken/tree/d71e383862fc735991fd2e759181480f066bf138#algorithms-supported

[open-wechat]: https://open.weixin.qq.com/

[agora-app-id-auth]: https://docs.agora.io/cn/Agora%20Platform/token#a-name--appidause-an-app-id-for-authentication
[agora-app-auth]: https://docs.agora.io/cn/Agora%20Platform/token#2-enable-the-app-certificate
[agora-restful-auth]: https://docs.agora.io/cn/cloud-recording/faq/restful_authentication
[cloud-recording]: https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start

[docker]: https://hub.docker.com
[docker-setting]: https://hub.docker.com/settings/security


## 技术选型

- [Node.js](https://github.com/nodejs/node)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Webpack](https://github.com/webpack/webpack)
- [ESLint](https://github.com/eslint/eslint)
- [Babel](https://github.com/babel/babel)
- [MySQL](https://github.com/mysql/mysql-server)
- [Redis](https://github.com/redis/redis)
- [Fastify](https://github.com/fastify/fastify)
- [Ajv](https://github.com/ajv-validator/ajv)
- [TypeORM](https://github.com/typeorm/typeorm)
- [Axios](https://github.com/axios/axios)
- [date-fns](https://github.com/date-fns/date-fns)
- [ioredis](https://github.com/luin/ioredis)
