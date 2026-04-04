📺 Criterion Channel 24/7 Monitor
Este projeto é um rastreador (scraper) automatizado que monitora a programação do canal linear Criterion Channel 24/7. O objetivo é criar um histórico real dos filmes exibidos, já que o canal não oferece uma grade horária retroativa oficial.

🚀 Como Funciona
Scraper (Node.js + Puppeteer): Um robô entra no site What's on Now a cada 15 minutos.

Captura de Dados: Ele extrai o título do filme atual e calcula o horário de término baseado na informação "starts in" do site.

Armazenamento: Os dados são salvos automaticamente no arquivo programacao.csv.

Automação (GitHub Actions): O script roda em um servidor na nuvem do GitHub, dispensando a necessidade de manter um computador ligado.

📊 Estrutura do Arquivo CSV
O arquivo programacao.csv segue o formato:
"Título do Filme","Horário de Captura","Horário Estimado de Término"

⚠️ Notas sobre o Agendamento (Cron)
O GitHub Actions utiliza um sistema de agendamento de baixa prioridade para contas gratuitas.

Intervalo configurado: 15 minutos.

Comportamento real: O GitHub pode atrasar a execução em períodos de alta demanda, resultando em "gaps" de algumas horas na captura.

Atividade: Este repositório precisa de commits ocasionais para que o agendador não entre em modo de hibernação.

🛠️ Tecnologias Utilizadas
Node.js

Puppeteer (Navegação headless)

GitHub Actions (Automação e CI/CD)

Como rodar manualmente
Se você notar que o GitHub "pulou" muitos filmes, você pode forçar uma execução:

Vá na aba Actions.

Selecione Monitor Criterion 24h à esquerda.

Clique no botão Run workflow.
