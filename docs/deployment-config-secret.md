# Deploy configuration from GitHub Environment Secrets

The dev and production workflows read the same secret name from different
GitHub Environments:

| GitHub Environment | Source file                     | Secret                        |
| ------------------ | ------------------------------- | ----------------------------- |
| `flat-server-dev`  | `config/development.local.yaml` | `FLAT_SERVER_CONFIG_YAML_B64` |
| `production`       | `config/production.local.yaml`  | `FLAT_SERVER_CONFIG_YAML_B64` |

Configure them without printing the encoded configuration:

```bash
./deploy/encode-config-b64.sh dev \
  | gh secret set FLAT_SERVER_CONFIG_YAML_B64 --env flat-server-dev

./deploy/encode-config-b64.sh prod \
  | gh secret set FLAT_SERVER_CONFIG_YAML_B64 --env production
```

During deployment, the selected GitHub Environment supplies its own value.
The workflow passes the encoded value to the container as
`FLAT_SERVER_CONFIG_YAML_B64`. `flat-server` decodes and parses it in memory,
then removes it from the Node.js process environment. No host configuration
file or Docker bind mount is created.

Local development and tests continue to load `config/<environment>.local.yaml`
or `config/<environment>.yaml` when the environment variable is absent.

## Classroom resource profile shape

Every `classroom_resources.profiles[]` entry must explicitly declare these
identity and placement fields in addition to its provider credentials:

```yaml
- key: agora-a-v3
  channel_code: agora-a
  config_version: 3
  rtc_provider: agora
  rtm_provider: agora
  media_region: CN
  recording_provider: agora
```

`key` is an opaque stable identifier; its spelling carries no version meaning.
Flat Server validates unique keys, unique `(channel_code, config_version)`
pairs, and positive versions, but versions need not be contiguous because old
versions may be removed after they are no longer referenced. Billing owns the
transactional "new version must increase" rule.

`media_region` is the explicit RTC/SFU placement and is exposed by internal
discovery and included in the configuration fingerprint. It must never be
derived from `whiteboard.region`, which is only a Netless data-plane region.

Profile objects are immutable after startup. Rotating an Agora account or any
credential requires adding a new profile/version and moving only new rooms to
it; never mutate a profile still referenced by a room, periodic room, or
recording.

## Security boundary

GitHub masks the secret in Actions logs. Do not print `CONFIG_B64`, enable shell
tracing, or pass it as a workflow output.

Docker stores container environment values in its metadata. Anyone with access
to the Docker daemon can retrieve them with `docker inspect`. If protection
from host administrators is required, use Docker/Kubernetes Secrets backed by
a mounted secret file instead of environment variables.
