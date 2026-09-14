# Freshly Backend

REST API для PWA Freshly: учёт продуктов и сроков годности. NestJS, Prisma, PostgreSQL, MinIO.

## Требования

- Node.js 20+
- npm
- Docker и Docker Compose (для PostgreSQL и MinIO)

## Установка

```bash
cp .env.example .env
npm install
```

Отредактируйте `.env`: секреты JWT, CORS, параметры MinIO и порог статуса «скоро истекает».

## Переменные окружения

| Переменная | Описание |
| --- | --- |
| `PORT` | Порт HTTP-сервера, по умолчанию `3000` |
| `NODE_ENV` | `development` или `production` |
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `JWT_ACCESS_SECRET` | Секрет access token |
| `JWT_ACCESS_EXPIRES_IN` | TTL access token, например `15m` |
| `JWT_REFRESH_SECRET` | Секрет refresh token |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh token, например `7d` |
| `CORS_ORIGIN` | Origin клиента или список через запятую. `*` разрешает все |
| `EXPIRING_SOON_DAYS` | Число дней до истечения для статуса «скоро истекает» |
| `MINIO_ENDPOINT` | Хост MinIO для сервера (`localhost` или `minio` в Docker) |
| `MINIO_PORT` | Порт S3 API, обычно `9000` |
| `MINIO_USE_SSL` | `true` или `false` |
| `MINIO_ACCESS_KEY` | Access key MinIO |
| `MINIO_SECRET_KEY` | Secret key MinIO |
| `MINIO_BUCKET` | Имя бакета |
| `MINIO_PUBLIC_URL` | URL MinIO, доступный браузеру, для presigned-ссылок на фото |

## Миграции Prisma

После запуска PostgreSQL:

```bash
npx prisma migrate dev
npx prisma db seed
```

Пресет-категории и места хранения входят в начальную миграцию. `db seed` делает те же записи идемпотентно.

Для уже существующей БД без `migrate dev`:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Запуск

### Локальная разработка (приложение без Docker)

Поднимаются только PostgreSQL и MinIO:

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Если порт `5432` уже занят, измените проброс в `docker-compose.yml` и `DATABASE_URL`.

API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`  
MinIO Console: `http://localhost:9001`

### Production в Docker

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Контейнер приложения применяет миграции при старте. `MINIO_ENDPOINT` внутри сети Compose — `minio`, `MINIO_PUBLIC_URL` должен указывать на адрес, который открывает браузер (локально `http://localhost:9000`).

### Production без Docker-приложения

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

PostgreSQL и MinIO при этом должны быть доступны по значениям из `.env`.

## API

Аутентификация: JWT access token в заголовке `Authorization: Bearer <token>`. Refresh token передаётся в JSON-теле запросов `/api/auth/refresh` и `/api/auth/logout`.

Основные маршруты:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET/POST /api/catalogs/categories`, `GET/POST /api/catalogs/storage-locations`, `GET /api/catalogs/statuses`
- `POST/GET /api/products`, `GET/PATCH/DELETE /api/products/:id`
- `POST /api/products/:id/photo` (`multipart/form-data`, поле `photo`)
- `DELETE /api/products/:id/photo`
- `GET /api/health`

Список продуктов поддерживает `search`, `categoryId`, `storageLocationId`, `status`, `sortBy`, `sortOrder`, `page`, `limit`.

## Скрипты

```bash
npm run start:dev    # watch-режим
npm run build
npm run start:prod
npm run lint         # eslint с автоисправлением
npm run lint:check   # eslint без записи файлов
npm test
npm run prisma:migrate
npm run prisma:seed
```

## CI

GitHub Actions запускает lint, тесты, сборку NestJS и сборку Docker-образа.
