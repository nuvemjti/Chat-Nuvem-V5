#!/bin/bash

# Carregar variáveis do arquivo .env
if [ -f backend/.env ]; then
  export $(cat backend/.env | xargs)
else
  echo "Arquivo .env não encontrado!"
  exit 1
fi

# Pega o nome do diretório atual
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
#get only the folder name
REDIS_NAME=${DIR##*/}

# Verificar se todas as variáveis estão definidas
if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ] || [ -z "$REDIS_PASSWORD" ]; then
  echo "Uma ou mais variáveis de ambiente estão faltando no arquivo .env"
  exit 1
fi

# Nome do container Redis
CONTAINER_NAME="redis-${REDIS_NAME}"

# Remover container atual (se existir)
if docker ps -a --format "{{.Names}}" | grep -Eq "^${CONTAINER_NAME}$"; then
  echo "Parando e removendo container existente: ${CONTAINER_NAME}..."
  docker stop ${CONTAINER_NAME}
  docker rm ${CONTAINER_NAME}
fi

# Criar novo container Redis
echo "Criando novo container Redis com o nome: ${CONTAINER_NAME}..."
docker run --name ${CONTAINER_NAME} \
  -p ${REDIS_PORT}:6379 \
  --restart always \
  -v redis-data-${DB_NAME}:/data \
  --detach redis:7 \
  redis-server \
  --requirepass ${REDIS_PASSWORD} \
  --maxmemory 2gb \
  --maxmemory-policy noeviction

# Verificar se o container foi criado com sucesso
if [ $? -eq 0 ]; then
  echo "Container Redis ${CONTAINER_NAME} criado com sucesso!"
else
  echo "Erro ao criar o container Redis ${CONTAINER_NAME}."
  exit 1
fi
