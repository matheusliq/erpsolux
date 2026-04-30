# Padrões de Deploy, Prisma e TypeScript (ERP Solux)

Este documento estabelece as regras obrigatórias que devem ser seguidas sempre que houver alterações no banco de dados, no Prisma Schema ou na estrutura de tipagem do projeto, garantindo que o deploy na Vercel nunca quebre por erros de build.

## 1. Regras para Alterações no Banco de Dados (Prisma)

Sempre que o arquivo `prisma/schema.prisma` for alterado (adição de tabelas, modificação de campos, deleção de relações):

1. **Geração Imediata:** Execute `npx prisma generate` imediatamente. O Next.js e o TypeScript dependem do Prisma Client atualizado para inferir tipos.
2. **Migrações:** Se a alteração impactar o banco de dados de produção/desenvolvimento, garanta que o comando `npx prisma db push` ou `npx prisma migrate dev` seja executado e testado localmente.
3. **Checagem de Relações (Obrigatório):** Verifique se o campo modificado é um campo primitivo (ex: `String`, `Int`) ou uma relação (ex: objeto contendo `{ id, name }`). **A maior causa de quebra de interface gráfica é tentar acessar propriedades de objetos em campos que na verdade são apenas strings.**

## 2. Tipagem no Front-end (React/Next.js)

1. **Espelhamento de Tipos:** Sempre que criar ou modificar um componente, as interfaces/tipos TypeScript (ex: `type Material = { ... }`) devem refletir **exatamente** o que o Prisma retorna.
2. **Evite Tipagem Mágica/Cega:** Nunca assuma a estrutura de um objeto sem olhar o Prisma Schema. Por exemplo, se `category` é um `String` no banco, o front-end não pode tratá-lo como `category?.name`.
3. **Fim do `any`:** Ao realizar *fetches* (ações do servidor), tipe explicitamente os retornos em vez de deixá-los como `any`. Isso força o TypeScript a acusar erros se você mapear as propriedades incorretamente.

## 3. Checklist Pré-Commit / Pré-Deploy

Antes de fazer o commit e o push (que engatilharão o deploy na Vercel), execute os seguintes comandos no terminal:

### Passo A: Validação Passiva (Rápida)
```bash
npx tsc --noEmit
```
*O que faz:* Analisa todo o código do projeto em busca de métodos inexistentes, variáveis faltando, erros de importação e incompatibilidade de tipos (como aconteceu com o `category?.name` e a falta dos ícones `ArrowUp`/`ArrowDown`).

### Passo B: Simulação de Build (Definitiva)
```bash
npm run build
```
*O que faz:* Simula o processo exato que a Vercel executará. Se o `build` terminar com `Exit code: 0` localmente, **ele funcionará na Vercel de forma garantida**.

## 4. O Que Fazer se o `npx tsc --noEmit` falhar?
1. **Não faça o git push.** A Vercel quebrará de qualquer forma.
2. Localize o arquivo e a linha apontada no terminal.
3. Se for um erro do tipo `Property '...' does not exist on type 'string'`, significa que você está tentando acessar um atributo de um objeto num campo que é um texto primitivo. Adapte a renderização visual.
4. Se for `Cannot find name '...'`, geralmente é uma falha de importação no topo do arquivo.
