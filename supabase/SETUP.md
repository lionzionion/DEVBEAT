# DEVBEAT — Configuração de contas (2026-11-15)

## Concluído pelo ChatGPT

- Projeto Supabase exclusivo: **DEVBEAT** (`izglvbkrdjxdijyfioda`), região `sa-east-1`; custo informado na criação: US$ 0/mês.
- Tabelas `public.devbeat_profiles` e `public.devbeat_libraries` criadas com chaves estrangeiras em `auth.users`.
- RLS ativo em ambas, com políticas SELECT, INSERT, UPDATE e DELETE limitadas a `auth.uid()`.
- Acesso de leitura de `anon` negado; Security Advisors sem alertas na verificação inicial.
- `config.mjs` contém apenas URL pública e chave **publishable**. Nunca publicar `service_role`, `sb_secret_`, senha do banco ou tokens pessoais.

## Configuração de autenticação ainda necessária no painel

1. Acesse [Authentication → URL Configuration](https://supabase.com/dashboard/project/izglvbkrdjxdijyfioda/auth/url-configuration).
2. Defina **Site URL** como `https://lionzionion.github.io/DEVBEAT/`.
3. Adicione exatamente `https://lionzionion.github.io/DEVBEAT/` à lista de **Redirect URLs** e salve.
4. Em [Authentication → Providers](https://supabase.com/dashboard/project/izglvbkrdjxdijyfioda/auth/providers), confirme que o provedor **Email** está ativo e que a política de confirmação de e-mail está adequada. Antes de abrir o cadastro a outros usuários, configure um serviço SMTP apropriado e os limites de envio de e-mails.
5. Abra [DEVBEAT online](https://lionzionion.github.io/DEVBEAT/) e teste com duas contas de e-mail distintas: cadastrar → confirmar e-mail → entrar → favoritar e salvar playlist → abrir em outro navegador → verificar histórico e biblioteca. A segunda conta **não** deve conseguir acessar dados da primeira.

## Referências

- [Redirect URLs (Supabase)](https://supabase.com/docs/guides/auth/redirect-urls)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Cuidados técnicos

- Visitantes usam `localStorage`; ao criar biblioteca na nuvem, o sistema pode oferecer a importação dos dados locais.
- As coleções usam JSONB por usuário, com semântica de *última escrita vence* se duas sessões salvarem em simultâneo. A evolução posterior deverá adotar versionamento de conflito.
- Para escala de muitos usuários, normalizar tabelas de playlists, faixas e histórico.
