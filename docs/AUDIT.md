# Auditoria do protótipo FORJA

## Estado encontrado

- Repositório com um único commit e publicação estática em GitHub Pages.
- Stack: HTML, CSS e JavaScript sem framework, bundler ou backend.
- Arquivos de aplicação: `index.html`, `styles.css`, `script.js`.
- Assets locais: três banners gerados em PNG.
- Não existem package manager, typecheck, lint, testes, banco, migrations ou CI.

## Funcionalidades existentes

- Tela visual de login.
- Catálogo de seis módulos.
- Carrossel de três banners.
- Modal com lista de aulas.
- Layout responsivo básico e animações.

## Mocks e hardcodes

- Usuário, email e senha em texto puro no JavaScript enviado ao navegador.
- Nome e iniciais do usuário no HTML.
- Cursos, aulas, progresso e estados de acesso no JavaScript/HTML.
- Não existe sessão persistente nem proteção de rota.
- Não existe conteúdo protegido: todo o conteúdo é público no bundle.

## Riscos e dívida técnica

- O login atual não é autenticação e não oferece segurança.
- GitHub Pages não executa backend, webhooks ou banco de dados.
- Não há separação entre pagamento, assinatura e autorização.
- Não há modelo extensível para cursos, aulas, e-books ou campanhas.
- Não há suporte real a `/liderflix` além de arquivos estáticos.
- Marca fictícia FORJA conflita com o produto final.

## Elementos reaproveitáveis

- Hierarquia da home e experiência de catálogo.
- Banner rotativo, cards 16:9, trilhas e progresso.
- Três fotografias cinematográficas como assets complementares.
- Linguagem de movimento e microinterações, recalibradas para a marca oficial.

## Decisão

Migrar o repositório raiz para uma aplicação Next.js full-stack, preservando os assets e padrões de UX úteis. O protótipo estático não será tratado como base de segurança. PostgreSQL será a fonte de verdade; Stripe apenas processará eventos financeiros; permissões serão resolvidas por `AccessGrant` no backend.
