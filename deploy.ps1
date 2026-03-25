# deploy.ps1
# Script básico para automatizar commit e push

param(
    [string]$Message = "Deploy automático"
)

Write-Host "=== Iniciando Deploy ==="

# Adiciona todos os arquivos modificados
git add .

# Cria commit com mensagem personalizada
git commit -m $Message

# Envia para o repositório remoto
git push

Write-Host "=== Deploy enviado para GitHub. Vercel fará a publicação automática. ==="
