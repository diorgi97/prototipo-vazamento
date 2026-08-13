# Protótipo - Inspeção de Vazamentos de Ar Comprimido

Este repositório contém um protótipo simples de aplicação web para registrar inspeções de vazamentos (foto, departamento, seção, local, identificação da máquina, leitura do sensor), visualizar uma lista de inspeções e um dashboard por departamento.

Arquitetura mínima
- Backend: Node.js + Express
- Banco: SQLite (arquivo data.db)
- Frontend: arquivos estáticos em public/ (HTML, CSS, JS) usando Chart.js para gráficos

Como rodar localmente
1. Clone o repositório ou baixe os arquivos
2. Instale dependências:
   npm install
3. Em desenvolvimento (com reinício automático):
   npm run dev
   (precisa do nodemon instalado como dependência de desenvolvimento — já incluso no package.json)
4. Produção / normal:
   npm start
5. Abra no navegador:
   http://localhost:3000

Estrutura
- server.js — servidor Express e endpoints da API
- public/ — frontend estático (index.html, app.js, styles.css)
- uploads/ — imagens enviadas (criada automaticamente)
- data.db — banco SQLite (criado automaticamente)

Observações e próximos passos
- Adicionar autenticação e controle de permissões
- Geração de PDF com o relatório e envio por e-mail
- Integração com sensores via BLE ou API (dependendo do modelo)

Se quiser, posso abrir um Pull Request com melhorias (PDF, e-mail, cálculo de perda/custo) ou adicionar integração com um sensor específico se você fornecer o modelo.
