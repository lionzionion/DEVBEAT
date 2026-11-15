<div align="center">

# 🎧 DEVBEAT 2.0

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

**Sem um projeto Supabase configurado, as coleções são mantidas somente neste navegador.** Não há contas ativas ou sincronização remota ainda.

## Contas e sincronização: integração preparada

O frontend inclui `identity.mjs` para autenticação via e-mail/senha, recuperação de senha e biblioteca por usuário. Um esquema PostgreSQL com políticas **Row Level Security** isola a biblioteca individual. **O recurso só será habilitado depois que houver um projeto Supabase exclusivo do DEVBEAT, com a configuração pública em `config.mjs`.**

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
- A sincronização exige Supabase ativo e testado; ainda não está ativada por padrão.
- Sem banco conectado, a biblioteca fica apenas no dispositivo e pode ser perdida se os dados do navegador forem apagados.

## Licença

MIT · [Leandro Dias](https://github.com/lionzionion). Músicas fornecidas por [Audius](https://audius.co/).
