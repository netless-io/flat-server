# flat-server

此项目是 [flat](https://github.com/netless-io/flat) 所搭配使用的 `Node.js` 后端

主要是用于接收 _flat_ 的请求做出相关的操作(登陆、创建房间等)

### 开发

可以参考 `config/.env.default` 的内容，创建以下文件:

* `config/.env.development.local`
* `config/.env.production.local`

关于 _.env.*_ 命名可参看: [Files under version control](https://github.com/kerimdzhanov/dotenv-flow#files-under-version-control)

你可以 <kbd>Fork</kbd> 此项目，然后在 `https://github.com/你的用户名/flat-server/settings/secrets/actions` 中添加一些私有变量。

> `DOCKERHUB_*`、`SSH_*` 不需要填写到 _.env.*_ 文件里，他们应该填写到 _github action secrets_ 里。
> 所以如果你在开发环境时，是不需要关心 `DOCKERHUB_*`、`SSH_*` 的。

其值可参考: [环境变量值参考](#环境变量值参考)

如果你想在本地运行，那么你应该这么做（当然前提是你已经设置好 _.env.*_）:

```shell
yarn install --frozen-lockfile
yarn run start

# 打开另一个终端
node ./dist/index.js
# 如果你成功的启动，那么控制台应该会出现: ready on http://0.0.0.0:80
```

### 配置 MySQL、Redis

如果您正在在本地进行开发，暂时不想连接到远程的 MySQL 或 Redis 时。那么您需要做的第一件事就是 安装一个 _Docker_

如果您已经安装好 _Docker_ 了，那么接下来就应该找到你觉得合适的位置，创建一个文件夹，比如: `mkdir -p ~/Data/Docker/MySQL ~/Data/Docker/Redis`

> 当你按照下面的文档配置好 MySQL、Redis 时，记得要和 _.env.*_ 里的内容一致

如果你完全按照下面的流程做，那么你的 _.env.*_ 配置中的 _MySQL_ 和 _Redis_，看起来应该是这样:

```ini
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

现在你只需要在你的控制台中输入: 

```shell
cd ~/Data/Docker/MySQL
docker run -dit -p 3306:3306 --name mysql --restart always -v `pwd`/data:/var/lib/mysql -v `pwd`/conf.d:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=你在env里MYSQL_PASSWORD所填写的值  mysql
docker exec -it mysql bash
mysql -uroot -p你在env里MYSQL_PASSWORD所填写的值
CREATE DATABASE 你在env里MYSQL_DB所填写的值;
```

然后在项目里的 `src/v1/thirdPartyService/TypeORMService.ts` 里，添加: `synchronize: true`，然后重新执行 `node ./dist/index.js`，就可以了。

执行完成后，记得删除 `synchronize: true`，这个属性只有你修改了数据库字段信息的时候才会需要。

这个选项是为了同步 数据库表、字段到你的数据库里

#### Redis

打开控制台输入:

```shell
cd ~/Data/Docker/Redis
docker run -dit -p 6379:6379 --name redis -v `pwd`/data:/data -v `pwd`/conf:/usr/local/etc/redis --restart always redis --requirepass "你在env里REDIS_PASSWORD所填写的值"
```

### 环境变量值参考

其中变量列表为:

| 变量名                              | 描述                                                                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOCKERHUB_USERNAME                  | 你的 [hub.docker.com](https://hub.docker.com) 的账户名                                                                                                                                        |
| DOCKERHUB_TOKEN                     | 在 hub.docker 的 [设置页面](https://hub.docker.com/settings/security) 生成的 `token`                                                                                                          |
| SERVER_PORT                         | 服务部署好后，需要公开暴露的端口                                                                                                                                                              |
| REDIS_HOST                          | redis 连接地址                                                                                                                                                                                |
| REDIS_PORT                          | redis 连接端口                                                                                                                                                                                |
| REDIS_PASSWORD                      | redis 连接密码                                                                                                                                                                                |
| REDIS_DB                            | redis 连接 `db` 名                                                                                                                                                                            |
| MYSQL_HOST                          | MySQL 连接地址                                                                                                                                                                                |
| MYSQL_PORT                          | MySQL 连接端口                                                                                                                                                                                |
| MYSQL_USER                          | MySQL 用户名                                                                                                                                                                                  |
| MYSQL_PASSWORD                      | MySQL 密码                                                                                                                                                                                    |
| MYSQL_DB                            | MySQL 要连接的数据库名                                                                                                                                                                        |
| SSH_HOST                            | 部署的 SSH 地址                                                                                                                                                                               |
| SSH_USERNAME                        | SSH 用户名                                                                                                                                                                                    |
| SSH_KEY                             | SSH 秘钥                                                                                                                                                                                      |
| SSH_PORT                            | SSH 连接端口                                                                                                                                                                                  |
| JWT_SECRET                          | JWT 秘钥                                                                                                                                                                                      |
| JWT_ALGORITHMS                      | JWT 加密算法，详情见: [Algorithms supported](https://github.com/auth0/node-jsonwebtoken/tree/d71e383862fc735991fd2e759181480f066bf138#algorithms-supported)                                   |
| CLOUD_STORAGE_CONCURRENT            | 云存储(云盘)的并发量，即: 同一时间只能上传多少个文件数(默认: 3)                                                                                                                               |
| CLOUD_STORAGE_SINGLE_FILE_SIZE      | 云存储(云盘)上传文件时，单个文件的最大大小(默认: 500M)                                                                                                                                        |
| CLOUD_STORAGE_TOTAL_SIZE            | 云存储(云盘)总量的最大大小(默认: 2G)                                                                                                                                                          |
| CLOUD_STORAGE_PREFIX_PATH           | 云存储(云盘)上传路径的前缀(默认: cloud-storage，前后不能有 `/`)                                                                                                                               |
| CLOUD_STORAGE_ALLOW_FILE_SUFFIX     | 云存储(云盘)支持上传的文件后缀                                                                                                                                                                |
| WECHAT_APP_ID                       | 在 [微信开放平台](https://open.weixin.qq.com/) 中 `网站应用` 里的 `AppID`                                                                                                                     |
| WECHAT_APP_SECRET                   | 在 [微信开放平台](https://open.weixin.qq.com/) 中 `网站应用` 里的 `AppSecret`                                                                                                                 |
| AGORA_APP_ID                        | agora app id，详情见: [Use an App ID for authentication](https://docs.agora.io/cn/Agora%20Platform/token#a-name--appidause-an-app-id-for-authentication)                                      |
| AGORA_APP_CERTIFICATE               | agora app certificate，详情见: [Enable the App Certificate](https://docs.agora.io/cn/Agora%20Platform/token#2-enable-the-app-certificate)                                                     |
| AGORA_RESTFUL_ID                    | agora restful id，详情见: [Restful Authentication](https://docs.agora.io/cn/cloud-recording/faq/restful_authentication)                                                                       |
| AGORA_RESTFUL_SECRET                | agora restful secret，详情见: [Restful Authentication](https://docs.agora.io/cn/cloud-recording/faq/restful_authentication)                                                                   |
| AGORA_OSS_VENDOR                    | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_ACCESS_KEY_ID             | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_ACCESS_KEY_SECRET         | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_REGION                    | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_BUCKET                    | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_FOLDER                    | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_PREFIX                    | agora oss 配置，详情见: [Cloud Recording Start](https://docs.agora.io/cn/cloud-recording/restfulapi/#/%E4%BA%91%E7%AB%AF%E5%BD%95%E5%88%B6/start) -> Schema -> clientRequest -> storageConfig |
| NETLESS_ACCESS_KEY                  | netless(白板) AK，详情见: [Projects and permissions](https://developer.netless.link/document-zh/home/project-and-authority)                                                                   |
| NETLESS_SECRET_ACCESS_KEY           | netless(白板) SK，详情见: [Projects and permissions](https://developer.netless.link/document-zh/home/project-and-authority)                                                                   |
| ALIBABA_CLOUD_OSS_ACCESS_KEY        | 阿里云 OSS AK，详情见: [访问秘钥](https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-zzk-f64-fdh)                                               |
| ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET | 阿里云 OSS SK，详情见: [访问秘钥](https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-zzk-f64-fdh)                                               |
| ALIBABA_CLOUD_OSS_BUCKET            | 阿里云 OSS bucket，详情见: [存储空间](https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-iiy-4uv-rb4)                                           |
| ALIBABA_CLOUD_OSS_REGION            | 阿里云 OSS region，详情见: [地域](https://help.aliyun.com/document_detail/31827.html?spm=a2c4g.11186623.6.625.3d8b42cdo4Ybgn#title-3qf-u3w-nsp)                                               |


其中需要注意的一点是: `SSH_KEY`

这个是由 `ssh-keygen -t rsa -b 4096` 生成的秘钥（以: `-----BEGIN OPENSSH PRIVATE KEY-----` 开头）。

然后需要进入到服务器里，把 `ssh` 公钥追加到 ` ~/.ssh/authorized_keys` 里即可。

### 技术选型

* [Node.js](https://github.com/nodejs/node)
* [TypeScript](https://github.com/microsoft/TypeScript)
* [Webpack](https://github.com/webpack/webpack)
* [ESLint](https://github.com/eslint/eslint)
* [Babel](https://github.com/babel/babel)
* [MySQL](https://github.com/mysql/mysql-server)
* [Redis](https://github.com/redis/redis)
* [Fastify](https://github.com/fastify/fastify)
* [Ajv](https://github.com/ajv-validator/ajv)
* [TypeORM](https://github.com/typeorm/typeorm)
* [Axios](https://github.com/axios/axios)
* [date-fns](https://github.com/date-fns/date-fns)
* [ioredis](https://github.com/luin/ioredis)
