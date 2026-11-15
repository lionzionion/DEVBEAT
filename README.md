<div align="center">

# 🎧 DEVBEAT 2.3

### Seu código tem ritmo. Sua biblioteca também.

**Player musical para desenvolvedores — com descoberta de faixas, CodeFlow, playlists, histórico e estrutura para contas sincronizadas.**

[🌐 Abrir aplicação](https://lionzionion.github.io/DEVBEAT/) · [💻 Código-fonte](https://github.com/lionzionion/DEVBEAT) · [🎼 Catálogo musical](https://audius.co/)

</div>

## O que funciona agora

- 🎵 **Busca de músicas no Audius**, tendências, categorias e paginação para explorar mais resultados.
- 🎛️ **Player web**: reprodução, pausa, fila, faixas anteriores e próximas, repetição e embaralhamento.
- 💻 **CodeFlow**: cinco modos para acompanhar programação e estudo.
- ❤️ **Favoritos** e **múltiplas playlists** (criar, selecionar, excluir).
- 🕒 **Histórico** de até 80 faixas reproduzidas, com última faixa e posição de reprodução armazenadas.
- 📱 Interface responsiva e uso como visitante sem cadastro.
- ☷ **Fila de reprodução editável:** botão ↳ para ouvir em seguida; abrir fila pela barra inferior ou pelo player expandido; subir, descer, remover e limpar faixas futuras.
- ◎ **Modo foco de 25 minutos:** experiência imersiva no player expandido, com cronômetro, pausa e reinício. O timer não modifica o streaming do Audius.
- 🎚️ **Player expandido:** clique na capa para abrir a tela Tocando Agora com vinil animado, controles acessíveis e barra de progresso sincronizada.
- ✨ **Microanimações:** capa, indicadores de execução e espectro visual sincronizado ao estado de play/pause, respeitando a preferência por movimento reduzido. O espectro é decorativo e não mede frequências reais.

**O Supabase exclusivo do DEVBEAT já foi criado e conectado ao frontend.** O login com e-mail/senha depende também da configuração de URLs de redirecionamento e da validação real do fluxo de confirmação de e-mail no painel Supabase. Visitantes continuam usando armazenamento local.

## Contas e sincronização: conexão configurada

O frontend inclui `identity.mjs` para autenticação via e-mail/senha, recuperação de senha e biblioteca por usuário. Um esquema PostgreSQL com políticas **Row Level Security** isola a biblioteca individual. O cliente guarda temporariamente alterações pendentes por conta no navegador, para permitir recuperação após falhas de conexão. **Projeto Supabase DEVBEAT criado, duas tabelas com RLS implementadas e chave pública vinculada em `config.mjs`.** É necessário confirmar a Site URL e Redirect URL em Auth antes de liberar o cadastro publicamente.

Veja [o passo a passo de configuração](./supabase/SETUP.md).

> Nunca inclua chaves secretas, `service_role`, senha do banco ou arquivos `.env` com credenciais no GitHub. O frontend utiliza somente a *publishable key* pública e políticas RLS.

## Tecnologias

HTML5 • CSS3 • JavaScript ES Modules • Web Audio nativo (`HTMLAudioElement`) • Audius REST API • GitHub Pages • Node.js Test Runner • Supabase Auth/PostgreSQL (integração preparada)

## Executar e testar localmente

```bash
npx serve .
npm test
npm run check
```

## Arquitetura

```text
DEVBEAT/
├─ index.html                  interface web
├─ app.js                      player, views, playlists, histórico
├─ styles.css                  tema responsivo
├─ catalog.mjs                 cliente Audius, busca e paginação
├─ queue.mjs                   operações testáveis da fila
├─ identity.mjs                Auth, sessão e sync (opcional)
├─ config.mjs                  configuração pública do Supabase
├─ manifest.webmanifest        web app
├─ supabase/
│  ├─ schema.sql               tabelas e políticas RLS
│  └─ SETUP.md                 ativação guiada
├─ tests/                      testes de catálogo e biblioteca
└─ .github/workflows/pages.yml CI/CD GitHub Pages
```

## Limitações

- Disponibilidade das faixas e permissão de streaming dependem do Audius. Nem todas as faixas podem ser reproduzidas.
- A versão web não incorpora o Spotube nem o catálogo comercial do Spotify.
- A conexão Supabase está ativa; a autenticação completa e a sincronização entre dispositivos ainda exigem testes com contas reais e configuração de URL de retorno.
- Sem banco conectado, a biblioteca fica apenas no dispositivo e pode ser perdida se os dados do navegador forem apagados.

## Licença

MIT · [Leandro Dias](https://github.com/lionzionion). Músicas fornecidas por [Audius](https://audius.co/).
