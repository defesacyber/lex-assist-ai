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
- [x] Integração com gateway de pagamento (Stripe)

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
- [x] Testes unitários backend (47 testes passando)
- [x] Validação de fluxos principais


## 14. Integração Sistemas Judiciais (Novos Requisitos)
- [x] Cliente PJe eCJUS (SOAP/WS-Security) para consulta de processos
- [x] Cliente e-SAJ REST (Bearer Token) para TJ-SP e outros tribunais
- [x] Cliente CNJ Datajud (OAuth 2.0) para metadados processuais
- [x] Sincronização automática de movimentações (30 min interval)
- [x] Detecção de novas movimentações e decisões
- [x] Download automático de documentos judiciais

## 15. WebSocket Real-time Updates
- [x] Servidor WebSocket para atualizações em tempo real
- [x] Sistema de rooms por caso para broadcast direcionado
- [x] Notificações push de novas movimentações
- [x] Latência <100ms para atualizações

## 16. Compliance e Segurança
- [x] Logs auditáveis (CNJ 615/2025)
- [x] Conformidade LGPD (criptografia, direito ao esquecimento)
- [x] Hash SHA-256 de documentos
- [x] TLS 1.3 para todas as comunicações

## 17. Métricas e Monitoramento
- [x] Dashboard de status das integrações
- [x] Métricas de performance (latência, throughput)
- [x] Alertas de falha de sincronização
- [x] Health check endpoint


## 18. Olho da Lei - Monitoramento de Jurisprudência (AUDIUM)
- [x] Monitoramento 24/7 de decisões STF/STJ/TJs
- [x] Alerta automático de jurisprudência favorável ao caso
- [x] Notificações em tempo real de mudanças de entendimento
- [x] Indexação semântica de decisões relevantes

## 19. Match de Juízes - Análise de Perfil Judicial (AUDIUM)
- [x] Banco de dados com histórico de decisões por juiz
- [x] IA analisa padrões de aceitação por tipo de caso
- [x] Sugestão de teses que cada juiz mais aceita
- [x] Score de probabilidade por magistrado

## 20. Health Score do Caso (AUDIUM)
- [x] Score 0-100 baseado em múltiplos fatores
- [x] Análise de prazos cumpridos
- [x] Avaliação de documentação completa
- [x] Indicador de risco de perda
- [x] Dashboard visual com score por caso

## 21. Radar de Prazos Cruzados (AUDIUM)
- [x] Detecção de conflitos entre prazos
- [x] Alerta de audiências no mesmo dia/horário
- [x] Sugestão automática de reagendamento
- [x] Visualização de calendário com conflitos

## 22. Calculadora de Honorários Preditiva (AUDIUM)
- [x] Previsão de honorários baseada em complexidade
- [x] Análise de valor da causa e tribunal
- [x] Histórico de honorários na região
- [x] Sugestão de valor otimizado

## 23. Modo Pós-Audiência em 90s (AUDIUM)
- [x] Geração de relatório pré-formatado instantâneo
- [x] Alertas baseados em padrões do magistrado
- [x] Criação automática de tarefas e prazos
- [x] Indicador de risco de indeferimento


## 24. Integração Stripe para Pagamentos
- [x] Adicionar feature Stripe ao projeto
- [x] Configurar produtos e preços no Stripe (Free, Professional, Enterprise)
- [x] Implementar checkout session para assinaturas
- [x] Configurar webhooks para eventos de pagamento
- [x] Atualizar página de assinaturas com botões de checkout
- [x] Implementar portal do cliente Stripe para gerenciamento
- [x] Sincronizar status de assinatura com banco de dados
- [x] Testes de fluxo de pagamento (47 testes passando)
