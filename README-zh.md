# Agora Flat Server

项目 flat-server 是 [Agora Flat](https://github.com/netless-io/flat) 开源教室搭配使用的 `Node.js` 后端。主要是用于响应 Flat 前端的请求：

## 特性

- 帐户系统
    - [x] 微信登陆
    - [x] Github 登陆
    - [x] 谷歌登陆
- 房间管理
    - [x] 预定房间
    - [x] 周期性房间
- [x] 互动白板、实时音视频（RTC）、即时消息（RTM）签名鉴权
- [x] 云端录制回放
- [x] 多媒体课件云存储（云盘）

## 本地开发

通过以下方式可以让 flat-server 在本地中运行起来：

### 安装

```shell
yarn install --frozen-lockfile
```

### 配置环境变量

1. 创建文件 `config/development.local.yaml`
2. 按照文件 `config/defaults.yaml` 的格式添加环境变量。

- 环境变量值可参考下方: [环境变量值参考](#环境变量值参考)。

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

本地开发不需要部署。如果需要上线，依据你习惯的方式部署。

> **Warning**
> 如果你之前部署过此项目, 请先查看 [迁移文档](./scripts/migration/README-zh.md)

## 环境变量值参考

```yaml
server:
    # server 启动端口
    port: 80

redis:
    # Redis 连接地址 
    host:
    # Redis 连接端口
    port:
    # Redis 连接用户名
    username:
    # Redis 连接密码
    password:
    # Redis 连接 db 名
    db:
    # 基于 Redis 实现的延迟队列 db 名
    queueDB:

mysql:
    # MySQL 连接地址
    host:
    # MySQL 连接端口
    port:
    # MySQL 用户名
    username:
    # MySQL 密码
    password:
    # MySQL 要连接的数据库名
    db:

jwt:
    # JWT 秘钥
    secret:
    # JWT 加密算法，见: https://github.com/auth0/node-jsonwebtoken/tree/d71e383862fc735991fd2e759181480f066bf138#algorithms-supported
    algorithms:

# 所服务的前端地址
website: https://flat-web-dev.whiteboard.agora.io

log:
    # Log 日志路径，详情见: https://github.com/netless-io/flat-server/blob/main/src/utils/EnvVariable.ts
    pathname: "{{PROJECT_DIR}}/logs"
    # Log 文件名称，详情见: https://github.com/netless-io/flat-server/blob/main/src/utils/EnvVariable.ts
    filename: "{{DAY_DATE}}"

cloud_storage:
    # 云盘同一时间上传文件数，默认 3
    concurrent: 3
    # 云盘上传单个文件大小最大值，默认 500M
    single_file_size: 524288000
    # 云盘总量最大值，默认 2G
    total_size: 2147483648
    # 云盘上传路径的前缀，默认 cloud-storage，前后不能有 /
    prefix_path: cloud-storage
    # 云盘支持上传的文件扩展名
    allow_file_suffix:
        - ppt
        - pptx
        - doc
        - docx
        - pdf
        - png
        - jpg
        - jpeg
        - gif
        - mp3
        - mp4

user:
    avatar:
        # 最大大小。默认： 5M
        size: 5242880
        # 用户支持上传的图片后缀
        allow_suffix:
            - png
            - jpg
            - jpeg

oauth:
    logo:
        # 上传 logo 在 oss 中的路径。默认为：oauth-logo（前后不能有 /）
        prefix_path: oauth-logo
        # 最大大小。默认：5M
        size: 5242880
        # logo 支持上传的图片后缀
        allow_suffix:
            - png
            - jpg
            - jpeg

login:
    wechat:
        # 见: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
        web:
            # 是否开启 web/desktop 端微信登录
            enable: false
            # App ID
            app_id:
            # App 秘钥
            app_secret:
        # 见: https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html
        mobile:
            # 是否开启移动端端微信登录
            enable: false
            # App ID
            app_id:
            # App 秘钥
            app_secret:
    # 见: https://docs.github.com/cn/developers/apps/building-oauth-apps/authorizing-oauth-apps
    github:
        # 是否开启 GitHub 登录
        enable: false
        # GitHub Client ID
        client_id:
        # GitHub Client Secret
        client_secret:
    # 开发中，见: https://developers.google.com/identity/protocols/oauth2
    google:
        # 是否开启 Google 登录
        enable: false
        # Google Client ID
        client_id:
        # Google Client Secret
        client_secret:
        # 回调地址
        redirect_uri:
    apple:
        # 是否开启 apple 登录
        enable: false
    # 暂不对外开放
    agora:
        # 是否开启 Agora 登录
        enable: false
        # Agora Client ID
        client_id:
        # Agora Client Secret
        client_secret:
        # Phone message login
    sms:
        # 是否开启 SMS 登录
        enable: true
        # 是否强制开启绑定手机号
        force: false
        # 只有 server.env 为 dev 时生效
        # 需要自己执行 MYSQL 以插入用户
        # INSERT INTO user_phone (version, user_uuid, user_name, phone_number) VALUES (1, 'uuid', 'name', 'phone');
        # INSERT INTO users (version, user_uuid, user_name, user_password, avatar_url) VALUES (1, 'uuid', 'name', '', 'url');
        test_users:
            -   phone:
                code:
        chinese_mainland:
            # 见:  https://help.aliyun.com/document_detail/419273.htm?spm=a2c4g.11186623.0.0.34371d58IYPbs3
            access_id:
            access_secret:
            template_code:
            sign_name:
        # 香港、澳门、台湾
        hmt:
            access_id:
            access_secret:
            template_code:
            sign_name:
        global:
            access_id:
            access_secret:
            template_code:
            sign_name:

agora:
    # 用于 RTC 与 RTM。见: https://docs.agora.io/cn/Agora%20Platform/get_appid_token?platform=All%20Platforms
    app:
        # Agora App ID
        id:
        # Agora App Certificate
        certificate:
    # 用于课程回放，见: https://docs.agora.io/cn/cloud-recording/faq/restful_authentication?platform=All%20Platforms
    restful:
        # Agora RESTful ID
        id:
        # Agora RESTful Secret
        secret:
    # 用于云端录制存储用户音视频。见: https://docs.agora.io/cn/cloud-recording/restfulapi/
    # 路径: Cloud Recording Start -> Schema -> clientRequest -> storageConfig
    oss:
        access_id:
        access_secret:
        vendor:
        region:
        bucket:
        folder:
        prefix:
    # 视频截图服务
    # https://docs.agora.io/cn/cloud-recording/cloud_recording_screen_capture?platform=RESTful
    screenshot:
        enable: false
        oss:
            access_id:
            access_secret:
            vendor:
            region:
            bucket:
            folder:
            prefix:
    # 消息通知服务
    # 见: https://docs-preprod.agora.io/cn/Agora%20Platform/ncs
    messageNotification:
        enable: false
        events:
            # 目前只支持 `productID: 3` 和 `eventType: 45`
            -   productID:
                eventType:
                secret:

# 见: https://docs.agora.io/cn/whiteboard/generate_whiteboard_token_at_app_server?platform=RESTful
whiteboard:
    # 白板 AK
    access_key:
    # 白板 SK
    secret_access_key:
    # 转码地区
    # "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon"
    convert_region:

# 存储服务
storage_service:
    # 目前只支持 oss
    type: oss
    oss:
        access_key:
        secret_key:
        endpoint:
        bucket:
        region:

# 内容审查
censorship:
    # 需要配置 agora 下的 screenshot 和 messageNotification 服务
    # messageNotification 需要加上: productID: 3 以及 eventType: 45 (有关这一点，请看: https://docs.agora.io/cn/cloud-recording/cloud_recording_callback_rest)
    # 其原理是对房间内的所有视频流进行定时截图，通过消息通知服务得知截图地址，并调用第三方(如: 阿里云) 的审查 API 对其进行检查
    video:
        enable: false
        # 目前只支持阿里云
        type: aliCloud
        # 见: https://help.aliyun.com/document_detail/63004.html
        aliCloud:
            access_id:
            access_secret:
            endpoint:
    # 见: https://docs.agora.io/cn/cloud-recording/audio_inspect_restful?platform=RESTful
    # 注意: 目前只有中文说明
    voice:
        enable: false
        # 当前只支持阿里云
        type: aliCloud
        aliCloud:
            uid:
            access_id:
            access_secret:
            callback_address:
    text:
        enable: false
        # 当前只支持阿里云
        type: aliCloud
        # 见: https://help.aliyun.com/document_detail/63004.html
        aliCloud:
            access_id:
            access_secret:
            endpoint:
```

如果需要部署，那么需要确保在部署的环境变量中存在以下变量:

| 变量名              | 描述              | 备注             |
|------------------|-----------------|----------------|
| METRICS_ENABLED  | 是否开启 metrics 监控 |                |
| METRICS_ENDPOINT | metrics url 路径  | 例如: `/metrics` |
| METRICS_PORT     | metrics 端口      | 例如: `9193`     |

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

## 免责声明

你可以将 Flat 用于商业用途但请注意我们不接受商业化需求定制与部署支持以及其它客户服务。如有相关需求请前往[灵动课堂](https://www.agora.io/cn/agora-flexible-classroom)。

本项目仅用于学习和交流使用，请遵守所在国的法律法规，切勿用于涉及政治、宗教、色情、犯罪等领域，一切违法后果请自负。
