# Agora Flat Server

Project flat-server is a `Node.js` server for the [Agora Flat](https://github.com/netless-io/flat) open source
classroom.

[中文](https://github.com/netless-io/flat-server/blob/main/README-zh.md)

## Features

- Login via
- [x] Wechat
- [x] Github
- [x] Google
- Room scheduling
    - [x] Ordinary rooms
    - [x] Periodic rooms
- [x] Signing tokens for Whiteboard, Real-time video/audio chat(RTC), Real-time messaging(RTM)
- [x] Cloud recording and replaying
- [x] Cloud Storage for multi-media courseware

## Develop Locally

Execute the following steps to run flat-server:

### Installation

```shell
yarn install --frozen-lockfile
```

### Setup Environment

1. Create files `config/development.local.yaml`.
1. Add environment variables following the `config/defaults.yaml` format.

- See [Environment Variables Reference](#environment-variables-reference) bellow.

### Run the Project

1. Execute at project root:

```shell
   yarn run start
```

3. Open another terminal and execute at project root:

```shell
   node ./dist/index.js
```

You should see `ready on http://0.0.0.0:80` if everything is OK.

## Deployment

Deployment is not needed for local development. If you want to bring the server up online, deploy anyway you like.

> **Warning**
> If you have deployed this project before, please see the [migration documentation](./scripts/migration/README.md)

## Environment Variables Reference

```yaml
server:
    # Server port
    port: 80

redis:
    # Redis host
    host:
    # Redis port
    port:
    # Redis username
    username:
    # Redis password
    password:
    # Redis db name
    db:
    # Redis-based implementation of the deferred queue db name
    queueDB:

mysql:
    # MySQL host
    host:
    # MySQL port
    port:
    # MySQL username
    username:
    # MySQL password
    password:
    # MySQL database
    db:

jwt:
    # JWT secret
    secret:
    # JWT crypto algorithms, see: https://github.com/auth0/node-jsonwebtoken/tree/d71e383862fc735991fd2e759181480f066bf138#algorithms-supported
    algorithms:

# Front-end address
website: https://flat-web-dev.whiteboard.agora.io

log:
    # Log path name, see: https://github.com/netless-io/flat-server/blob/main/src/utils/EnvVariable.ts
    pathname: "{{PROJECT_DIR}}/logs"
    # Log file name, see: https://github.com/netless-io/flat-server/blob/main/src/utils/EnvVariable.ts
    filename: "{{DAY_DATE}}"

cloud_storage:
    # Maximum count of Cloud Storage uploading files. Default: 3
    concurrent: 3
    # Maximum size of a Cloud Storage file. Default: 500M
    single_file_size: 524288000
    # Maximum Cloud Storage size of a user. Default: 2G
    total_size: 2147483648
    # Cloud Storage upload path prefix. Default: cloud-storage (No / prefix or suffix)
    prefix_path: cloud-storage
    # Cloud Storage supported file extensions
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
        # Maximum size. Default: 5M
        size: 5242880
        # User supported upload image file extensions
        allow_suffix:
            - png
            - jpg
            - jpeg

oauth:
    logo:
        # Upload logo path prefix. Default: oauth-logo (No / prefix or suffix)
        prefix_path: oauth-logo
        # Maximum size. Default: 5M
        size: 5242880
        # Logo supported upload image file extensions
        allow_suffix:
            - png
            - jpg
            - jpeg

login:
    wechat:
        # See: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
        web:
            # Whether to enable WeChat login on the web/desktop side
            enable: false
            # App ID
            app_id:
            # App Secret
            app_secret:
        # See: https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html
        mobile:
            # Whether to enable WeChat login on the mobile side
            enable: false
            # App ID
            app_id:
            # App Secret
            app_secret:
    # See: https://docs.github.com/cn/developers/apps/building-oauth-apps/authorizing-oauth-apps
    github:
        # Whether to enable GitHub login
        enable: false
        # GitHub Client ID
        client_id:
        # GitHub Client Secret
        client_secret:
    # In development, see: https://developers.google.com/identity/protocols/oauth2
    google:
        # Whether to enable Google login
        enable: false
        # Google Client ID
        client_id:
        # Google Client Secret
        client_secret:
        # Redirect URI
        redirect_uri:
    apple:
        # Whether to enable Apple login
        enable: false
    # Not open to the public at the moment
    agora:
        # Whether to enable Agora login
        enable: false
        # Agora Client ID
        client_id:
        # Agora Client Secret
        client_secret:
    # Phone message login
    sms:
        # Whether to enable SMS login
        enable: true
        # Is force binding phone
        force: false
        # Test user (Only valid if server.env is dev)
        # You need to run MYSQL yourself to insert the user
        # INSERT INTO user_phone (version, user_uuid, user_name, phone_number) VALUES (1, 'uuid', 'name', 'phone');
        # INSERT INTO users (version, user_uuid, user_name, user_password, avatar_url) VALUES (1, 'uuid', 'name', '', 'url');
        test_users:
            -   phone:
                code:
        chinese_mainland:
            # see:  https://help.aliyun.com/document_detail/419273.htm?spm=a2c4g.11186623.0.0.34371d58IYPbs3
            access_id:
            access_secret:
            template_code:
            sign_name:
        # Hong Kong, Macao and Taiwan regions of China
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
    # For RTC and RTM. See: https://docs.agora.io/en/Agora%20Platform/get_appid_token?platform=All%20Platforms
    app:
        # Agora App ID
        id:
        # Agora App Certificate
        certificate:
    # For classroom replaying. See: https://docs.agora.io/en/cloud-recording/faq/restful_authentication?platform=All%20Platforms
    restful:
        # Agora RESTful ID
        id:
        # Agora RESTful Secret
        secret:
    # For storing RTC Cloud Recording media files. See: https://docs.agora.io/en/cloud-recording/restfulapi/
    # Path: Cloud Recording Start -> Schema -> clientRequest -> storageConfig
    oss:
        access_id:
        access_secret:
        vendor:
        region:
        bucket:
        folder:
        prefix:
    # Video screenshot service
    # See: https://docs.agora.io/en/cloud-recording/cloud_recording_screen_capture?platform=RESTful
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
    # Message notification service
    # See: https://docs-preprod.agora.io/en/Agora%20Platform/ncs
    messageNotification:
        enable: false
        events:
            # Currently only supported `productID: 3` and `eventType: 45`
            -   productID:
                eventType:
                secret:

# See: https://docs.agora.io/en/whiteboard/generate_whiteboard_token_at_app_server?platform=RESTful
whiteboard:
    # Whiteboard AK
    access_key:
    # Whiteboard SK
    secret_access_key:
    # Convert Region
    # "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon"
    convert_region:

# Storage Service
storage_service:
    # Currently, only supported OSS
    type: oss
    oss:
        access_key:
        secret_key:
        endpoint:
        bucket:
        region:

# Content censorship
censorship:
    # Need to configure screenshot and messageNotification services under agora
    # messageNotification needs to be added: productID: 3 and eventType: 45 (see: https://docs.agora.io/en/cloud-recording/cloud_recording_callback_rest)
    # The principle is to take a screenshot of all the video streams in the room at regular intervals, get the screenshot address through the message notification service, and call a third party (e.g. AliCloud) to review the API to check it
    video:
        enable: false
        # Current only support aliCloud
        type: aliCloud
        # See: https://www.alibabacloud.com/help/en/content-moderation/latest/development-preparations-1
        aliCloud:
            access_id:
            access_secret:
            endpoint:
    # See: https://docs.agora.io/cn/cloud-recording/audio_inspect_restful?platform=RESTful
    # NOTE: No English description available at the moment
    voice:
        enable: false
        # Current only support aliCloud
        type: aliCloud
        aliCloud:
            uid:
            access_id:
            access_secret:
            callback_address:
    text:
        enable: false
        # Current only support aliCloud
        type: aliCloud
        # See: https://www.alibabacloud.com/help/en/content-moderation/latest/development-preparations-1
        aliCloud:
            access_id:
            access_secret:
            endpoint:
```

If deployment is required then you need to ensure that the following variables are present in the environment variables
for deployment:

| Variable Name    | Description                          | Note             |
|------------------|--------------------------------------|------------------|
| METRICS_ENABLED  | Whether to enable metrics monitoring |                  |
| METRICS_ENDPOINT | metrics url path                     | e.g.: `/metrics` |
| METRICS_PORT     | metrics port                         | e.g.: `9193`     |

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

## Disclaimer

You may use Flat for commercial purposes but please note that we do not accept customizational commercial requirements
and deployment supports. Nor do we offer customer supports for commercial usage. Please head
to [Flexible Classroom](https://www.agora.io/en/products/flexible-classroom) for such requirements.
