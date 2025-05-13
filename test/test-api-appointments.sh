#!/bin/bash

API_URL="http://localhost:3000/appointments"
TITLE_TESTE="Reunião de Teste"
TITLE_ATUALIZADO="Reunião Atualizada"

print_result() {
  echo -e "▶ $1"
  if [ $2 -eq 0 ]; then
    echo -e "  ✓ Sucesso\n"
  else
    echo -e "  ✖ Erro (Status: $2)\n"
  fi
}

# Função para extrair ID da resposta JSON
extract_id() {
  jq -r '._id // .id' response.txt 2>/dev/null
}

# 1. Criar novo agendamento
echo "1. Criando novo agendamento..."
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+1 hour")
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+2 hours")

response=$(curl -s -o response.txt -w "%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$TITLE_TESTE\",\"start\":\"$START_TIME\",\"end\":\"$END_TIME\"}")

[ $response -ge 200 ] && [ $response -lt 300 ] && status=0 || status=1
print_result "POST /appointments" $status
cat response.txt | jq '.' 2>/dev/null || cat response.txt
APPOINTMENT_ID=$(extract_id)

# 2. Listar agendamentos
echo "2. Listando agendamentos..."
response=$(curl -s -o response.txt -w "%{http_code}" -X GET "$API_URL")
[ $response -eq 200 ] && status=0 || status=1
print_result "GET /appointments" $status
cat response.txt | jq '.' 2>/dev/null || cat response.txt

# 3. Buscar agendamento específico
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "3. Buscando agendamento por ID..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X GET "$API_URL/$APPOINTMENT_ID")
  [ $response -eq 200 ] && status=0 || status=1
  print_result "GET /appointments/{id}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "3. ✖ Pulando teste de busca por ID (ID inválido ou não disponível)"
  echo "ID obtido: $APPOINTMENT_ID"
fi

# 4. Atualizar agendamento
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "4. Atualizando agendamento..."
  NEW_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+3 hours")
  NEW_END=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+4 hours")
  
  response=$(curl -s -o response.txt -w "%{http_code}" -X PUT "$API_URL/$APPOINTMENT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$TITLE_ATUALIZADO\",\"start\":\"$NEW_START\",\"end\":\"$NEW_END\"}")
  
  [ $response -eq 200 ] && status=0 || status=1
  print_result "PUT /appointments/{id}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "4. ✖ Pulando teste de atualização (ID inválido ou não disponível)"
fi

# 5. Excluir agendamento
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "5. Removendo agendamento..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X DELETE "$API_URL/$APPOINTMENT_ID")
  [ $response -eq 200 ] && status=0 || status=1
  print_result "DELETE /appointments/{id}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "5. ✖ Pulando teste de exclusão (ID inválido ou não disponível)"
fi

rm -f response.txt
echo "✅ Testes completos para a API de Agendamentos!"