# LexAssist AI - Project TODO

## Core Infrastructure
- [x] Database schema with all tables (users, cases, hearings, deadlines, documents, subscriptions)
- [x] tRPC routers for all features
- [x] LLM integration for predictive analysis
- [x] Whisper API integration for transcription

## 1. Análise Preditiva de Casos
- [x] Form de entrada de dados do caso (título, categoria, jurisdição, descrição, argumentos)
- [x] Integração com Gemini AI para análise
- [x] Dashboard de resultados (probabilidade, pontos fortes/fracos, riscos, estratégia)
- [x] Histórico de análises por caso

## 2. Simulador de Audiência AI
- [x] Geração de perguntas prováveis do juiz
- [x] Geração de perguntas da parte contrária
- [x] Sugestões de respostas estratégicas
- [x] Pontos de objeção para preparação
- [x] Interface de simulação interativa

## 3. Assistente de Audiência em Tempo Real
- [x] Transcrição de áudio via Whisper API
- [x] Indexação de conteúdo transcrito
- [x] Interface de gravação/upload de áudio
- [x] Visualização da transcrição em tempo real

## 4. Sistema de Alertas Estratégicos
- [x] Monitoramento de desvios da estratégia predita
- [x] Alertas visuais durante audiência
- [x] Sugestões de correção de rota

## 5. Geração de Minuta Pós-Audiência
- [x] Resumo executivo automático
- [x] Geração de minuta de petição
- [x] Exportação em formato editável

## 6. Painel de Controle de Prazos
- [x] Cadastro de prazos processuais
- [x] Cálculo automatizado (dias úteis, feriados, suspensões)
- [x] Score de Confiança para cada prazo
- [ ] Integração com calendário externo (Google Calendar)
- [x] Alertas escalonados (7, 3, 1 dia)

## 7. Integração Datajud (CNJ)
- [ ] Consulta de metadados processuais (requer credenciais)
- [ ] Busca de movimentações (requer credenciais)
- [ ] Sincronização de dados (requer credenciais)

## 8. Dashboard de Gestão de Casos
- [x] Listagem de casos ativos
- [x] Histórico de análises preditivas
- [x] Histórico de audiências
- [x] Métricas e estatísticas

## 9. Sistema de Documentos
- [x] Upload de documentos (petições, evidências)
- [x] Organização por caso
- [x] Armazenamento S3
- [x] Controle de acesso

## 10. Sistema de Assinaturas
- [x] Planos diferenciados (Free, Professional, Enterprise)
- [x] Controle de acesso por plano
- [x] Limites de uso por funcionalidade
- [ ] Integração com gateway de pagamento (Stripe)

## 11. Alertas e Notificações
- [x] Notificações in-app
- [x] Alertas de prazos por email
- [x] Centro de notificações

## 12. Landing Page e UI
- [x] Landing page profissional
- [x] Design system jurídico
- [x] Responsividade mobile
- [x] Dark/Light theme

## 13. Testes
- [ ] Testes unitários backend
- [ ] Validação de fluxos principais
