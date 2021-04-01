# Flat Server

Project flat-server is a `Node.js` server for the [Agora Flat](https://github.com/netless-io/flat) open source classroom.


## Features

-  Login via 
  - [x] Wechat
  - [ ] Github
  - [ ] Google
- Room scheduling
  - [x] Ordinary rooms
  - [x] Periodic rooms
- [x] Signing tokens for Whiteboard, Real-time video/audio chat(RTC), Real-time messaging(RTM)
- [x] Cloud recording and replaying
- [ ] Cloud Storage for multi-media courseware


## Develop Locally

Execute the following steps to run flat-server:


### Installation

1. <kbd>Fork</kbd> this repo so that Github Actions can work properly.
2. Then `git clone` the forked repo to local.
3. At project root：
   ```shell
   yarn install --frozen-lockfile
   ```


### Setup Environment


1. Create two files `config/.env.development.local` and `config/.env.production.local`.
1. Add environment variables following the `config/.env.default` format.

- See [Environment Variables Reference](#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%80%BC%E5%8F%82%E8%80%83) bellow.
- See [Files under version control](https://github.com/kerimdzhanov/dotenv-flow#files-under-version-control) for more about _.env.*_ naming.


### Setup MySQL and Redis

1. You may install _Docker_ locally if you don't have a remote MySQL and Redis.
1. After _Docker_ is installed, pick a location and create a directory for Database. e.g. `mkdir -p ~/Data/Docker/MySQL ~/Data/Docker/Redis`
1. Setup MySQL and Redis base on the _.env.*_ file we just created. For example let's say we have a _.env.*_ containing the following configs：

```shell
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# Redis password
REDIS_PASSWORD=123456
# Can also be other db name
REDIS_DB=0

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
# MySQL password
MYSQL_PASSWORD=123456
# Can also be other db name
MYSQL_DB=flat_server
```


#### MySQL

1. Replace the `(value of xxx)` with actual values and run the following commands: (Note the `;` in the end)
   ```shell
   cd ~/Data/Docker/MySQL
   docker run -dit -p 3306:3306 --name mysql --restart always -v `pwd`/data:/var/lib/mysql -v `pwd`/conf.d:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=(value of MYSQL_PASSWORD) mysql
   docker exec -it mysql bash
   mysql -uroot -p (value of MYSQL_PASSWORD)
   CREATE DATABASE (value of MYSQL_DB);
   ```
2. Find `createConnection` in file `src/v1/thirdPartyService/TypeORMService.ts`, add a property `synchronize: true` to the config object. This option is for synchronizing tables and fields to database.
3. Execute `node ./dist/index.js`.
4. After finished, delete `synchronize: true`. This property is only needed when database fields are altered.

#### Redis

Replace the `(value of xxx)` with actual values and run the following commands:

```shell
cd ~/Data/Docker/Redis
docker run -dit -p 6379:6379 --name redis -v `pwd`/data:/data -v `pwd`/conf:/usr/local/etc/redis --restart always redis --requirepass "(value of REDIS_PASSWORD)"
```


### Run the Project

1. Execute at project root:
   ```shell
   yarn run start
   ```
2. Open another terminal and execute at project root:
   ```shell
   node ./dist/index.js
   ```

You should see `ready on http://0.0.0.0:80` if everything is OK.


## Deployment

Deployment is not needed for local development. If you want to bring the server up online, deploy anyway you like. For example through Github Action：

1. If you forked this repo as `user_name/flat-server` then go to `https://github.com/user_name/flat-server/settings/secrets/actions` and add the same content of _.env.*_ to Action secrets.
2. Additionally add the `DOCKERHUB_*` and `SSH_*` variables. See the the last section of [Environment Variables Reference](#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%80%BC%E5%8F%82%E8%80%83) bellow.


## Environment Variables Reference

| Variable Name                       | Description                                    |  Note                                                                      |
| ----------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| SERVER_PORT                         | Server port                                    | e.g. `8087`                                                                |
| REDIS_HOST                          | Redis host                                     | e.g. `127.0.0.1`                                                           |
| REDIS_PORT                          | Redis port                                     | e.g. `6379`                                                                |
| REDIS_PASSWORD                      | Redis password                                 |                                                                            |
| REDIS_DB                            | Redis `db` name                                | e.g. `0`                                                                   |
| MYSQL_HOST                          | MySQL host                                     | e.g. `127.0.0.1`                                                           |
| MYSQL_PORT                          | MySQL port                                     | e.g. `3306`                                                                |
| MYSQL_USER                          | MySQL user name                                | e.g. `root`                                                                |
| MYSQL_PASSWORD                      | MySQL password                                 |                                                                            |
| MYSQL_DB                            | MySQL database                                 | e.g. `flat_server`                                                         |
| JWT_SECRET                          | JWT secret                                     |                                                                            |
| JWT_ALGORITHMS                      | JWT crypto algorithms                          | See [Algorithms supported][jwt-crypto]                                     |
| CLOUD_STORAGE_CONCURRENT            | Maximum count of Cloud Storage uploading files | Default: `3`                                                               |
| CLOUD_STORAGE_SINGLE_FILE_SIZE      | Maximum size of a Cloud Storage file           | Default: `524288000` (500M)                                                |
| CLOUD_STORAGE_TOTAL_SIZE            | Maximum Cloud Storage size of a user           | Default: `2147483648` (2G)                                                 |
| CLOUD_STORAGE_PREFIX_PATH           | Cloud Storage upload path prefix               | Default: `cloud-storage` (No `/` prefix or suffix)                         |
| CLOUD_STORAGE_ALLOW_FILE_SUFFIX     | Cloud Storage supported file extensions        | Default: `ppt,pptx,doc,docx,pdf,png,jpg,jpeg,gif`                          |
| WECHAT_APP_ID                       | [Wechat Open Platform][open-wechat] App ID     |                                                                            |
| WECHAT_APP_SECRET                   | [Wechat Open Platform][open-wechat] App Secret |                                                                            |
| AGORA_APP_ID                        | Agora App ID                                   | For RTC and RTM. See [Use an App ID for authentication][agora-app-id-auth] |
| AGORA_APP_CERTIFICATE               | Agora App Certificate                          | See [Enable the App Certificate][agora-app-auth]                           |
| AGORA_RESTFUL_ID                    | Agora RESTful ID                               | For classroom replaying. See [Restful Authentication][agora-restful-auth]  |
| AGORA_RESTFUL_SECRET                | Agora RESTful Secret                           | See [Restful Authentication][agora-restful-auth]                           |
| AGORA_OSS_VENDOR                    | Agora Cloud Recording OSS                      | For storing RTC Cloud Recording media files. See [Cloud Recording Start][cloud-recording] -> Schema -> clientRequest -> storageConfig |
| AGORA_OSS_ACCESS_KEY_ID             | Agora Cloud Recording OSS                      | As above                                                                   |
| AGORA_OSS_ACCESS_KEY_SECRET         | Agora Cloud Recording OSS                      | As above                                                                   |
| AGORA_OSS_REGION                    | Agora Cloud Recording OSS                      | As above                                                                   |
| AGORA_OSS_BUCKET                    | Agora Cloud Recording OSS                      | As above                                                                   |
| AGORA_OSS_FOLDER                    | Agora Cloud Recording OSS                      | As above                                                                   |
| AGORA_OSS_PREFIX                    | Agora Cloud Recording OSS                      | As above                                                                   |
| NETLESS_ACCESS_KEY                  | Netless Whiteboard AK                          | See [Projects and permissions][netless-auth]                               |
| NETLESS_SECRET_ACCESS_KEY           | Netless Whiteboard SK                          | See [Projects and permissions][netless-auth]                               |
| ALIBABA_CLOUD_OSS_ACCESS_KEY        | Alibaba Cloud OSS AK                           | For storing multi-media courseware. See [AccessKey][ali-secret]            |
| ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET | Alibaba Cloud OSS SK                           | As Above                                                                   |
| ALIBABA_CLOUD_OSS_BUCKET            | Alibaba Cloud OSS bucket                       | See [Bucket][ali-bucket]                                                   |
| ALIBABA_CLOUD_OSS_REGION            | Alibaba Cloud OSS region                       | See [Region][ali-region]                                                   |


If you need to deploy to a remote server, add the following variables additionally:

| Variable Name                       | Description                                                      | Note                      |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| DOCKERHUB_USERNAME                  | Your [hub.docker.com][docker] user name                          |                           |
| DOCKERHUB_TOKEN                     | `token` generated from hub.docker [setting page][docker-setting] |                           |
| SSH_HOST                            | SSH host                                                         |                           |
| SSH_USERNAME                        | SSH user name                                                    |                           |
| SSH_KEY                             | SSH key                                                          | Generate a secret key with `ssh-keygen -t rsa -b 4096` (Starts with `-----BEGIN OPENSSH PRIVATE KEY-----`). Then in the server, add the ssh public key to `~/.ssh/authorized_keys` |
| SSH_PORT                            | SSH port                                                         |                           |

[ali-secret]: https://www.alibabacloud.com/help/doc-detail/31827.htm?spm=a2c63.l28256.b99.71.71a55139Cd6Xiy#title-zzk-f64-fdh
[ali-bucket]: https://www.alibabacloud.com/help/doc-detail/31827.htm?spm=a2c63.l28256.b99.71.71a55139Cd6Xiy#title-iiy-4uv-rb4
[ali-region]: https://www.alibabacloud.com/help/doc-detail/31827.htm?spm=a2c63.l28256.b99.71.71a55139Cd6Xiy#title-3qf-u3w-nsp

[netless-auth]: https://docs.agora.io/cn/whiteboard/generate_whiteboard_token_at_app_server?platform=RESTful

[jwt-crypto]: https://github.com/auth0/node-jsonwebtoken/tree/d71e383862fc735991fd2e759181480f066bf138#algorithms-supported

[open-wechat]: https://open.weixin.qq.com/

[agora-app-id-auth]: https://docs.agora.io/en/Agora%20Platform/token
[agora-app-auth]: https://docs.agora.io/en/Agora%20Platform/token
[agora-restful-auth]: https://docs.agora.io/en/cloud-recording/faq/restful_authentication
[cloud-recording]: https://docs.agora.io/en/cloud-recording/restfulapi/#/Cloud%20Recording/start

[docker]: https://hub.docker.com
[docker-setting]: https://hub.docker.com/settings/security


## Tech Stack

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
