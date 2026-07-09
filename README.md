# InsightFlow

InsightFlow e uma aplicacao SaaS de Business Intelligence para pequenas e medias empresas, criada num unico projeto Laravel com React em `resources/js`.

## Tecnologias

- Laravel 13
- React + Vite
- Tailwind CSS 4
- MySQL ou SQLite em desenvolvimento
- Laravel Sanctum
- Axios
- Recharts
- Lucide React

## Funcionalidades

- Login, registo, logout e rotas API protegidas com Sanctum
- Estrutura multiempresa com roles `admin`, `manager` e `employee`
- Dashboard com KPIs, receita, lucro, despesas, clientes, vendas e crescimento mensal
- CRUDs de clientes, produtos, vendas, despesas e funcionarios
- Analytics com graficos avancados e filtros por periodo
- Reports com resumo financeiro e impressao em HTML
- Importacao CSV para clientes, produtos, vendas e despesas
- Exportacao CSV
- Notificacoes e alertas
- AI Insights simulado baseado nos dados reais da base de dados
- Definicoes de perfil, empresa e membros da equipa
- UI SaaS responsiva com modo claro/escuro, estados vazios e loading skeletons

## Instalacao

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
npm run dev
```

No Windows PowerShell, se `npm` estiver bloqueado pela politica de execucao, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Base de dados

Por defeito o projeto Laravel vem com SQLite. Para MySQL, configure no `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=insightflow
DB_USERNAME=root
DB_PASSWORD=
```

Depois execute:

```bash
php artisan migrate:fresh --seed
```

## Utilizadores de teste

- admin@example.com / password
- manager@example.com / password
- employee@example.com / password

## Arquitetura

- `routes/api.php`: endpoints REST protegidos por Sanctum
- `app/Http/Controllers/Api/InsightFlowController.php`: controlador principal da API
- `app/Models`: modelos multiempresa
- `database/migrations`: tabelas de empresas, utilizadores, CRUDs, notificacoes e tokens Sanctum
- `database/seeders/DatabaseSeeder.php`: dados realistas de demonstracao
- `resources/js/app.js`: SPA React com layout, dashboard, CRUDs e paginas principais
- `resources/css/app.css`: tema visual SaaS responsivo

## Screenshots sugeridos

- Login
- Dashboard com KPIs e graficos
- CRUD de vendas
- Analytics
- Reports imprimivel
- AI Insights
- Modo escuro

## Proximos passos

- Separar o controlador API em controllers dedicados por dominio
- Adicionar policies formais por role
- Integrar IA real para insights narrativos
- Melhorar importacao com preview editavel antes de guardar
- Adicionar testes automatizados para fluxos criticos