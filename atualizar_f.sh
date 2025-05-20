#!/bin/bash

echo "🚀 Atualizando o frontend, por favor aguarde."

# Define o diretório atual e o nome da pasta
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
NAME=${DIR##*/}
echo "📂 Nome da pasta: $NAME"

# Pergunta ao usuário qual branch será utilizada
read -p "🌿 Qual branch deseja utilizar? (padrão: janeiro): " BRANCH
BRANCH=${BRANCH:-janeiro}  # Usa 'janeiro' como padrão se o usuário não inserir nada
echo "✅ Branch selecionada: $BRANCH"

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

echo "⏳ Resetando a branch local para a branch remota '$BRANCH'..."
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH
echo "✅ Branch '$BRANCH' atualizada com sucesso."

echo "📂 Restaurando manifest.json customizado..."
if [ -f "$TEMP_MANIFEST_PATH" ]; then
  cp "$TEMP_MANIFEST_PATH" "$CUSTOM_MANIFEST_PATH"
  echo "✅ Arquivo manifest.json customizado restaurado."
else
  echo "⚠️ Nenhum arquivo manifest.json encontrado para restaurar."
fi

cd frontend || exit
echo "📂 Acessando a pasta 'frontend'."

# Pergunta sobre atualização dos pacotes
read -p "🔄 Deseja atualizar os pacotes do node? (Y/N): " UPDATE_PACKAGES
if [[ $UPDATE_PACKAGES =~ ^[Yy]$ ]]; then
    echo "🧹 Removendo node_modules..."
    rm -rf node_modules
    echo "📦 Instalando dependências..."
    npm install --legacy-peer-deps
else
    echo "⏭️ Mantendo pacotes existentes..."
fi

echo "🏗️ Construindo aplicação frontend..."
npm run build
echo "✅ Build do frontend concluído."

echo "🎉 Atualização do frontend concluída com sucesso! 🚀"