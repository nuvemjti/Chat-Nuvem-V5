#!/bin/bash

# Verifica se o parâmetro -f foi passado
FORCE_MODE=false
if [[ "$1" == "-f" ]]; then
  FORCE_MODE=true
fi

echo "🚀 Atualizando, por favor aguarde."

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

sleep 2
echo "🔍 Verificando a versão do Node.js..."

CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$CURRENT_NODE_VERSION" -lt 18 ]; then
  echo "⚠️ Versão atual do Node.js ($CURRENT_NODE_VERSION) é inferior a 18. Atualizando para 22.x..."
  sudo apt-get remove -y nodejs
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  sudo npm install -g npm
  echo "✅ Node.js atualizado para a versão $(node -v)."
else
  echo "✅ Versão do Node.js ($CURRENT_NODE_VERSION) é 20 ou superior. Continuando..."
fi

sleep 2
echo "📂 Salvando manifest.json customizado..."
CUSTOM_MANIFEST_PATH="frontend/public/manifest.json"
TEMP_MANIFEST_PATH="/tmp/manifest.json"

if [ -f "$CUSTOM_MANIFEST_PATH" ]; then
  cp "$CUSTOM_MANIFEST_PATH" "$TEMP_MANIFEST_PATH"
  echo "✅ Arquivo manifest.json salvo temporariamente."
else
  echo "⚠️ Nenhum manifest.json customizado encontrado para salvar."
fi

echo "📂 Restaurando manifest.json customizado..."
if [ -f "$TEMP_MANIFEST_PATH" ]; then
  cp "$TEMP_MANIFEST_PATH" "$CUSTOM_MANIFEST_PATH"
  echo "✅ Arquivo manifest.json customizado restaurado."
else
  echo "⚠️ Nenhum arquivo manifest.json encontrado para restaurar."
fi

echo "🛑 Parando instância PM2: $NAME..."
pm2 stop $NAME

cd backend || exit
echo "📂 Acessando a pasta 'backend'."

if [ "$FORCE_MODE" = false ]; then
  read -p "🔄 Deseja atualizar os pacotes do node para o backend? (Y/N): " UPDATE_PACKAGES_BACKEND
else
  UPDATE_PACKAGES_BACKEND="N"
fi

if [[ $UPDATE_PACKAGES_BACKEND =~ ^[Yy]$ ]]; then
  echo "🧹 Removendo node_modules do backend..."
  rm -rf node_modules
  echo "📦 Instalando dependências do backend..."
  npm install
else
  echo "⏭️ Mantendo pacotes existentes do backend..."
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

cd ../frontend || exit
echo "📂 Acessando a pasta 'frontend'."

if [ "$FORCE_MODE" = false ]; then
  read -p "🔄 Deseja atualizar os pacotes do node para o frontend? (Y/N): " UPDATE_PACKAGES_FRONTEND
else
  UPDATE_PACKAGES_FRONTEND="N"
fi

if [[ $UPDATE_PACKAGES_FRONTEND =~ ^[Yy]$ ]]; then
  echo "🧹 Removendo node_modules do frontend..."
  rm -rf node_modules
  echo "📦 Instalando dependências do frontend..."
  npm install --legacy-peer-deps
else
  echo "⏭️ Mantendo pacotes existentes do frontend..."
fi

echo "🏗️ Construindo aplicação frontend..."
npm run build
echo "✅ Build do frontend concluído."

echo "🔄 Limpando logs antigos no PM2..."
pm2 flush
echo "✅ Logs limpos com sucesso."

echo "🎉 Atualização concluída com sucesso! 🚀"