#/bin/bash

MYSQL_CONTAINER_NAME=flat-server-test-mysql
MYSQL_ROOT_PASSWORD=flat-server-test
MYSQL_DATABASE=flat_server
MYSQL_EXPORT_PORT=7519

REDIS_CONTAINER_NAME=flat-server-test-redis
REDIS_PASSWORD=flat-server-test
REDIS_EXPORT_PORT=7528

if [ ! "$(docker ps -q -f name=$MYSQL_CONTAINER_NAME)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=$MYSQL_CONTAINER_NAME)" ]; then
        docker rm $MYSQL_CONTAINER_NAME
    fi

    echo "creating mysql container..."
    docker run -dit -p $MYSQL_EXPORT_PORT:3306 --name $MYSQL_CONTAINER_NAME --health-cmd='mysqladmin ping --silent' --restart always -e MYSQL_DATABASE=$MYSQL_DATABASE -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD mysql
fi

# link: https://stackoverflow.com/a/53717981/6596777
while ! docker exec $MYSQL_CONTAINER_NAME mysql --user=root --password=$MYSQL_ROOT_PASSWORD -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done

docker exec $MYSQL_CONTAINER_NAME mysql --user=root --password=$MYSQL_ROOT_PASSWORD -e "DROP DATABASE IF EXISTS $MYSQL_DATABASE; CREATE DATABASE $MYSQL_DATABASE" >/dev/null 2>&1;
echo "mysql container ready!"


if [ ! "$(docker ps -q -f name=$REDIS_CONTAINER_NAME)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=$REDIS_CONTAINER_NAME)" ]; then
        docker rm $REDIS_CONTAINER_NAME
    fi

    echo "creating redis container..."
    docker run -dit -p $REDIS_EXPORT_PORT:6379 --name $REDIS_CONTAINER_NAME --restart always redis --requirepass "$REDIS_PASSWORD"
fi

docker exec -i $REDIS_CONTAINER_NAME redis-cli -a $REDIS_PASSWORD FLUSHALL >/dev/null 2>&1;

echo "redis container ready!"
