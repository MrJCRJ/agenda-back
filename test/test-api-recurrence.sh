#!/bin/bash

API_URL="http://localhost:3000/appointments"
TITLE_TESTE="Reunião Recorrente"
TITLE_ATUALIZADO="Reunião Recorrente Modificada"
TASK_DESCRIPTION="Preparar apresentação"

print_result() {
  echo -e "▶ $1"
  if [ $2 -eq 0 ]; then
    echo -e "  ✓ Sucesso\n"
  else
    echo -e "  ✖ Erro (Status: $2)\n"
  fi
}

extract_id() {
  jq -r '._id // .id' response.txt 2>/dev/null
}

extract_task_id() {
  jq -r '.tasks[0]._id // .tasks[0].id' response.txt 2>/dev/null
}

# 1. Criar agendamento recorrente
echo "1. Criando agendamento recorrente..."
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+1 hour")
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+2 hours")
RRULE="FREQ=WEEKLY;COUNT=3"  # Toda semana, 3 ocorrências

response=$(curl -s -o response.txt -w "%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"$TITLE_TESTE\",
    \"start\":\"$START_TIME\",
    \"end\":\"$END_TIME\",
    \"isRecurring\":true,
    \"recurrenceRule\":\"$RRULE\"
  }")

[ $response -ge 200 ] && [ $response -lt 300 ] && status=0 || status=1
print_result "POST /appointments (recorrente)" $status
cat response.txt | jq '.' 2>/dev/null || cat response.txt
APPOINTMENT_ID=$(extract_id)

# 2. Listar todos os agendamentos (incluindo recorrentes)
echo "2. Listando todos os agendamentos..."
response=$(curl -s -o response.txt -w "%{http_code}" -X GET "$API_URL")
[ $response -eq 200 ] && status=0 || status=1
print_result "GET /appointments" $status
cat response.txt | jq '.' 2>/dev/null || cat response.txt

# 3. Buscar série de agendamentos recorrentes
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "3. Buscando série de agendamentos recorrentes..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X GET "$API_URL?recurrenceId=$APPOINTMENT_ID")
  [ $response -eq 200 ] && status=0 || status=1
  print_result "GET /appointments?recurrenceId={id}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
  
  # Extrair o ID do segundo evento recorrente
  SECOND_INSTANCE_ID=$(jq -r '.[1]._id // .[1].id' response.txt 2>/dev/null)
else
  echo "3. ✖ Pulando teste de busca recorrente (ID inválido)"
fi

# 4. Modificar apenas uma instância futura
if [ -n "$SECOND_INSTANCE_ID" ] && [ "$SECOND_INSTANCE_ID" != "null" ]; then
  echo "4. Modificando apenas uma instância futura..."
  NEW_START=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+1 week +3 hours")
  NEW_END=$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+1 week +4 hours")
  
  response=$(curl -s -o response.txt -w "%{http_code}" -X PUT "$API_URL/$SECOND_INSTANCE_ID" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\":\"$TITLE_ATUALIZADO\",
      \"start\":\"$NEW_START\",
      \"end\":\"$NEW_END\",
      \"originalStart\":\"$START_TIME\"
    }")
  
  [ $response -eq 200 ] && status=0 || status=1
  print_result "PUT /appointments/{id} (instância recorrente)" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "4. ✖ Pulando teste de modificação de instância (ID inválido)"
fi

# 5. Adicionar tarefa a um agendamento
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "5. Adicionando tarefa ao agendamento..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X POST "$API_URL/$APPOINTMENT_ID/tasks" \
    -H "Content-Type: application/json" \
    -d "{\"description\":\"$TASK_DESCRIPTION\"}")
  
  [ $response -eq 200 ] && status=0 || status=1
  print_result "POST /appointments/{id}/tasks" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
  TASK_ID=$(extract_task_id)
else
  echo "5. ✖ Pulando teste de adição de tarefa (ID inválido)"
fi

# 6. Atualizar tarefa
if [ -n "$APPOINTMENT_ID" ] && [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
  echo "6. Atualizando tarefa..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X PUT "$API_URL/$APPOINTMENT_ID/tasks/$TASK_ID" \
    -H "Content-Type: application/json" \
    -d "{\"completed\":true}")
  
  [ $response -eq 200 ] && status=0 || status=1
  print_result "PUT /appointments/{id}/tasks/{taskId}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "6. ✖ Pulando teste de atualização de tarefa (IDs inválidos)"
fi

# 7. Remover tarefa
if [ -n "$APPOINTMENT_ID" ] && [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
  echo "7. Removendo tarefa..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X DELETE "$API_URL/$APPOINTMENT_ID/tasks/$TASK_ID")
  [ $response -eq 200 ] && status=0 || status=1
  print_result "DELETE /appointments/{id}/tasks/{taskId}" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "7. ✖ Pulando teste de remoção de tarefa (IDs inválidos)"
fi

# 8. Excluir série de agendamentos
if [ -n "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "8. Removendo série de agendamentos..."
  response=$(curl -s -o response.txt -w "%{http_code}" -X DELETE "$API_URL/$APPOINTMENT_ID?allRecurring=true")
  [ $response -eq 200 ] && status=0 || status=1
  print_result "DELETE /appointments/{id}?allRecurring=true" $status
  cat response.txt | jq '.' 2>/dev/null || cat response.txt
else
  echo "8. ✖ Pulando teste de exclusão de série (ID inválido)"
fi

rm -f response.txt
echo "✅ Testes completos para a API de Agendamentos com Recorrência e Tarefas!"