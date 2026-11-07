# Comanda Fácil

Sistema mobile-first de comandas para bares e restaurantes.

## Objetivo do produto

- Comandas por mesa e individuais.
- Lançamento de pedidos com envio para cozinha ou bar.
- Painel de preparo em tempo real.
- Divisão de contas por pessoa, item ou valor.
- Pagamentos parciais em dinheiro, cartão e PIX (confirmação manual).
- Gestão de cardápio, categorias, adicionais e disponibilidade.
- Perfis de acesso: administrador, atendente e cozinha.
- PWA responsivo em português do Brasil.

## Arquitetura-alvo

- Web: React + TypeScript + Vite (PWA mobile-first).
- API: Node.js + TypeScript + Express.
- Banco: PostgreSQL, com Prisma ORM e migrations versionadas.
- Autenticação: JWT com RBAC validado no backend.
- Tempo real: WebSocket.
- Hospedagem: Render.
- Imagens: armazenamento compatível com S3.

O sistema não deve depender de Lovable, lovable.app ou Supabase gerenciado pelo Lovable.

## Estrutura planejada

- `apps/web`: aplicação web/PWA.
- `apps/api`: API HTTP e WebSocket.
- `packages/shared`: contratos, validações e tipos compartilhados.
- `prisma`: schema e migrations do banco.

## Segurança

Este repositório é público por decisão do proprietário. Não armazene aqui:
- arquivos `.env`;
- tokens, senhas, chaves privadas ou credenciais;
- dumps de produção ou dados pessoais reais.

Use variáveis de ambiente no Render e mantenha apenas `.env.example` com nomes e valores fictícios.

## Status

Em desenvolvimento. O código original auditado ainda continha uma página inicial placeholder e integrações proprietárias; a implementação independente está sendo preparada. Nenhuma implantação em produção deve ser considerada concluída até que build, testes, migrations e fluxos críticos sejam validados.

## Desenvolvimento

Os comandos e instruções locais serão documentados conforme a estrutura independente for implementada.
