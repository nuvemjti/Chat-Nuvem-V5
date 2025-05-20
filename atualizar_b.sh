#!/bin/bash

echo "🚀 Atualizando o backend, por favor aguarde."

# Define o diretório atual e o nome da pasta
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
NAME=${DIR##*/}
echo "📂 Nome da pasta: $NAME"

HAS_BACKEND=$(pm2 list | grep "$NAME-backend")

if [ -z "$HAS_BACKEND" ]; then
  echo "💡 Nenhuma instância backend encontrada no PM2. Usando nome padrão: $NAME."
else
  if [[ $NAME != *"-backend"* ]]; then
    NAME="$NAME-backend"
    echo "💡 Instância backend detectada. Ajustando nome para: $NAME."
  fi
fi

# Pergunta ao usuário qual branch será utilizada
read -p "🌿 Qual branch deseja utilizar? (padrão: janeiro): " BRANCH
BRANCH=${BRANCH:-janeiro}  # Usa 'janeiro' como padrão se o usuário não inserir nada
echo "✅ Branch selecionada: $BRANCH"

echo "⏳ Resetando a branch local para a branch remota '$BRANCH'..."
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH
echo "✅ Branch '$BRANCH' atualizada com sucesso."

echo "🛑 Parando instância PM2: $NAME..."
pm2 stop $NAME

cd backend || exit
echo "📂 Acessando a pasta 'backend'."

# Pergunta sobre atualização dos pacotes
read -p "🔄 Deseja atualizar os pacotes do node? (Y/N): " UPDATE_PACKAGES
if [[ $UPDATE_PACKAGES =~ ^[Yy]$ ]]; then
    echo "🧹 Removendo node_modules..."
    rm -rf node_modules
    echo "📦 Instalando dependências..."
    npm install
else
    echo "⏭️ Mantendo pacotes existentes..."
fi

echo "🏗️ Construindo aplicação..."
npm run build
echo "✅ Build concluído."

echo "📄 Copiando arquivo .env para a pasta dist..."
cp .env dist/

echo "📂 Executando migrações do Sequelize..."
npx sequelize db:migrate
echo "✅ Migrações aplicadas com sucesso."

echo "🚀 Reiniciando aplicação no PM2 com ambiente de produção..."
NODE_ENV=production pm2 start $NAME --update-env --node-args="--max-old-space-size=8192"
echo "✅ Aplicação reiniciada."

echo "🎉 Atualização do backend concluída com sucesso! 🚀"