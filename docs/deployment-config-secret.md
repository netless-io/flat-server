# Deploy configuration from GitHub Environment Secrets

The dev and production workflows read the same secret name from different
GitHub Environments:

| GitHub Environment | Source file | Secret |
| --- | --- | --- |
| `flat-server-dev` | `config/development.local.yaml` | `FLAT_SERVER_CONFIG_YAML_B64` |
| `production` | `config/production.local.yaml` | `FLAT_SERVER_CONFIG_YAML_B64` |

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

## Security boundary

GitHub masks the secret in Actions logs. Do not print `CONFIG_B64`, enable shell
tracing, or pass it as a workflow output.

Docker stores container environment values in its metadata. Anyone with access
to the Docker daemon can retrieve them with `docker inspect`. If protection
from host administrators is required, use Docker/Kubernetes Secrets backed by
a mounted secret file instead of environment variables.
