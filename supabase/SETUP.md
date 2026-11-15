# Ativar contas e sincronização — DEVBEAT 2.0

**Necessário:** projeto novo e exclusivo do DEVBEAT no Supabase. Não reutilize bancos de clientes ou de outros aplicativos.

1. Crie um projeto Supabase na organização escolhida, verificando antes o plano e eventuais custos. Aguarde até o projeto ficar `ACTIVE`.
2. No SQL Editor desse projeto, execute [`schema.sql`](./schema.sql). Confira no Table Editor as tabelas `devbeat_profiles` e `devbeat_libraries` e se ambas têm RLS ativado.
3. Em Authentication → URL Configuration, defina Site URL `https://lionzionion.github.io/DEVBEAT/` e inclua a mesma URL como Redirect URL exata.
4. Em Authentication → Providers, habilite `Email`; configure a confirmação por e-mail e a entrega de e-mails de produção apropriada.
5. Em Project Settings → API Keys, copie **somente** a chave `sb_publishable_...` (pública). Em [`config.mjs`](../config.mjs), preencha `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Nunca exponha a secret key ou `service_role`.
6. Publique o commit e verifique no site: criar conta → confirmar e-mail → login → favoritar música → abrir em outro navegador/dispositivo → conferir histórico e playlists. Teste também com uma SEGUNDA conta: ela não pode ler músicas nem playlists da primeira.
7. Rode os Security Advisors do Supabase e verifique políticas e acesso de todas as tabelas.

A aplicação continua funcionando como visitante enquanto o banco estiver indisponível. A integração usa uma versão fixa de `supabase-js` carregada do CDN apenas se configurada.

## Cuidados

- Contas não se misturam com biblioteca visitante. Somente ao criar a primeira biblioteca será oferecida importação da biblioteca local.
- Os dados de cada usuário são filtrados com `auth.uid()` nas políticas RLS, inclusive inserção e atualização.
- O formato atual usa uma linha JSONB por usuário para coleções pessoais; para escala maior, migre futuramente para tabelas normalizadas e controle de concorrência.
- Para uso em vários dispositivos ao mesmo tempo, implemente posteriormente versionamento e tratamento de conflitos. O modelo inicial é *last write wins*.
