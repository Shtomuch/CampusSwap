# CampusSwap

Студентський маркетплейс для купівлі та продажу використаних підручників та речей.

## 📁 Детальна структура проекту

### Backend (.NET 9 - Clean Architecture)

```
src/
├── CampusSwap.Domain/              # ❤️ Серце системи - бізнес логіка
│   ├── Entities/                   # Основні сутності
│   │   ├── User.cs                # Користувач системи
│   │   ├── Listing.cs             # Оголошення про товар
│   │   ├── Order.cs               # Замовлення
│   │   ├── Message.cs             # Повідомлення в чаті
│   │   ├── Conversation.cs        # Розмова між користувачами
│   │   ├── SavedListing.cs        # Збережені оголошення
│   │   └── RefreshToken.cs        # Токени для оновлення сесії
│   ├── Enums/                      # Переліки
│   │   ├── ListingCategory.cs     # Категорії товарів
│   │   ├── ListingStatus.cs       # Статуси оголошень
│   │   ├── OrderStatus.cs         # Статуси замовлень
│   │   └── PaymentMethod.cs       # Методи оплати
│   └── ValueObjects/               # Об'єкти-значення
│       └── Money.cs                # Грошова сума
│
├── CampusSwap.Application/         # 🧠 Бізнес-логіка та Use Cases
│   ├── Features/                   # CQRS команди та запити
│   │   ├── Auth/                   # Аутентифікація
│   │   │   ├── Commands/           # RegisterUser, LoginUser, RefreshToken
│   │   │   └── DTOs/               # AuthResponse, TokenResponse
│   │   ├── Listings/               # Робота з оголошеннями
│   │   │   ├── Commands/           # CreateListing, UpdateListing, DeleteListing
│   │   │   ├── Queries/            # GetListings, GetListingById, GetMyListings
│   │   │   └── DTOs/               # ListingDto, CreateListingDto
│   │   ├── Orders/                 # Замовлення
│   │   │   ├── Commands/           # CreateOrder, ConfirmOrder, CompleteOrder
│   │   │   └── Queries/            # GetMyOrders, GetOrderById
│   │   └── Chat/                   # Чат
│   │       ├── Commands/           # SendMessage, MarkAsRead
│   │       └── Queries/            # GetConversations, GetMessages
│   ├── Interfaces/                 # Контракти
│   │   ├── IApplicationDbContext.cs # Інтерфейс бази даних
│   │   ├── ICurrentUserService.cs  # Сервіс поточного користувача
│   │   └── ITokenService.cs        # Сервіс JWT токенів
│   └── Common/                     # Спільні класи
│       ├── Mappings/               # AutoMapper профілі
│       ├── Validators/             # FluentValidation валідатори
│       └── Exceptions/             # Кастомні винятки
│
├── CampusSwap.Infrastructure/      # 🔧 Інфраструктура
│   ├── Data/                       # Робота з БД
│   │   ├── ApplicationDbContext.cs # Entity Framework контекст
│   │   ├── Configurations/         # Fluent API конфігурації таблиць
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── ListingConfiguration.cs
│   │   │   └── ... (інші конфігурації)
│   │   └── Migrations/             # Міграції БД (автогенеровані)
│   ├── Services/                   # Реалізації сервісів
│   │   ├── TokenService.cs         # JWT генерація та валідація
│   │   ├── CurrentUserService.cs   # Отримання поточного користувача
│   │   └── FileStorageService.cs   # Збереження файлів
│   └── DependencyInjection.cs      # Реєстрація сервісів
│
└── CampusSwap.WebApi/              # 🌐 Web API
    ├── Controllers/                 # REST контролери
    │   ├── AuthController.cs        # /api/auth/*
    │   ├── ListingsController.cs    # /api/listings/*
    │   ├── OrdersController.cs      # /api/orders/*
    │   └── ChatController.cs        # /api/chat/*
    ├── Hubs/                        # SignalR хаби
    │   └── ChatHub.cs               # Real-time чат
    ├── Middleware/                  # Проміжне ПЗ
    │   ├── ErrorHandlingMiddleware.cs # Обробка помилок
    │   └── RequestLoggingMiddleware.cs # Логування запитів
    ├── Program.cs                   # Точка входу, конфігурація
    ├── appsettings.json            # Налаштування
    └── appsettings.Development.json # Налаштування для розробки
```

### Frontend (React 18 + TypeScript)

```
client/
├── src/
│   ├── components/                 # 🎨 UI компоненти
│   │   ├── Header.tsx             # Шапка сайту з меню
│   │   ├── Footer.tsx             # Підвал сайту
│   │   ├── ListingCard.tsx        # Картка товару
│   │   ├── ListingGrid.tsx        # Сітка товарів
│   │   ├── SearchFilters.tsx      # Фільтри пошуку
│   │   ├── LoadingSpinner.tsx     # Індикатор завантаження
│   │   └── __tests__/              # Тести компонентів
│   │
│   ├── pages/                      # 📄 Сторінки
│   │   ├── HomePage.tsx           # Головна сторінка
│   │   ├── ListingDetailPage.tsx  # Деталі оголошення
│   │   ├── CreateListingPage.tsx  # Створення оголошення
│   │   ├── ProfilePage.tsx        # Профіль користувача
│   │   ├── MyListingsPage.tsx     # Мої оголошення
│   │   ├── SavedListingsPage.tsx  # Збережені оголошення
│   │   ├── OrdersPage.tsx         # Мої замовлення
│   │   ├── ChatPage.tsx           # Чат
│   │   ├── LoginPage.tsx          # Вхід
│   │   └── RegisterPage.tsx       # Реєстрація
│   │
│   ├── services/                   # 🔌 API сервіси
│   │   ├── api.ts                 # Axios інстанс з інтерцепторами
│   │   ├── authService.ts         # Методи аутентифікації
│   │   ├── listingService.ts      # Робота з оголошеннями
│   │   ├── orderService.ts        # Робота з замовленнями
│   │   └── chatService.ts         # Робота з чатом
│   │
│   ├── contexts/                   # 🎯 React контексти
│   │   ├── AuthContext.tsx        # Контекст аутентифікації
│   │   └── ThemeContext.tsx       # Контекст теми (світла/темна)
│   │
│   ├── hooks/                      # 🪝 Кастомні хуки
│   │   ├── useAuth.ts             # Хук для аутентифікації
│   │   ├── useListings.ts         # Хук для роботи з оголошеннями
│   │   └── useDebounce.ts         # Хук для debounce
│   │
│   ├── types/                      # 📝 TypeScript типи
│   │   ├── index.ts               # Основні типи та інтерфейси
│   │   ├── api.types.ts           # Типи для API
│   │   └── components.types.ts    # Типи для компонентів
│   │
│   ├── utils/                      # 🛠 Утиліти
│   │   ├── formatters.ts          # Форматування дат, грошей
│   │   ├── validators.ts          # Валідація форм
│   │   └── constants.ts           # Константи
│   │
│   ├── styles/                     # 🎨 Стилі
│   │   └── globals.css            # Глобальні стилі та Tailwind
│   │
│   ├── App.tsx                    # Головний компонент
│   ├── index.tsx                  # Точка входу
│   └── setupTests.ts              # Налаштування тестів
│
├── public/                         # Статичні файли
│   ├── index.html                 # HTML шаблон
│   └── placeholder.jpg            # Заглушка для зображень
│
├── package.json                    # Залежності та скрипти
├── tsconfig.json                  # TypeScript конфігурація
├── tailwind.config.js             # Tailwind CSS налаштування
└── postcss.config.js              # PostCSS налаштування
```

### Тести

```
tests/
├── CampusSwap.Domain.Tests/       # Тести доменного шару
│   └── Entities/                  # Тести сутностей
│       ├── UserTests.cs
│       ├── ListingTests.cs
│       ├── OrderTests.cs
│       └── MessageTests.cs
│
├── CampusSwap.Application.Tests/  # Тести бізнес-логіки
│   ├── Features/                  # Тести CQRS
│   │   ├── Listings/
│   │   │   ├── Commands/
│   │   │   └── Queries/
│   │   └── Orders/
│   └── Common/
│       └── MockDbSet.cs          # Допоміжний клас для мокінгу
│
└── CampusSwap.Integration.Tests/  # Інтеграційні тести
    ├── Controllers/               # Тести API ендпоінтів
    │   ├── AuthControllerTests.cs
    │   └── ListingsControllerTests.cs
    └── CustomWebApplicationFactory.cs # Тестовий сервер
```

## 🚀 Швидкий старт

### PostgreSQL версія
```bash
# Створити БД
createdb campusswap_db

# Оновити connection string в appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=campusswap_db;Username=denys;Password="
}

# Застосувати міграції
cd src/CampusSwap.WebApi
dotnet ef database update

# Запустити backend
dotnet run

# Запустити frontend
cd client
npm install
npm start
```

### 🔄 Зручне перемикання між PostgreSQL та SQLite

Проект налаштований для легкого перемикання між базами даних!

#### Використання PostgreSQL (за замовчуванням):
```json
// appsettings.json
"Database": {
  "Provider": "PostgreSQL"
}
```

#### Переключення на SQLite:
```json
// appsettings.json
"Database": {
  "Provider": "SQLite"
}
```

#### Перший запуск з SQLite:
```bash
# 1. Змінити Provider в appsettings.json на "SQLite"

# 2. Видалити старі міграції PostgreSQL
rm -rf src/CampusSwap.Infrastructure/Data/Migrations/*

# 3. Створити нові міграції для SQLite
cd src/CampusSwap.WebApi
dotnet ef migrations add InitialCreate
dotnet ef database update

# 4. Запустити проект
dotnet run
```

#### Повернення на PostgreSQL:
```bash
# 1. Змінити Provider в appsettings.json на "PostgreSQL"

# 2. Видалити міграції SQLite
rm -rf src/CampusSwap.Infrastructure/Data/Migrations/*

# 3. Створити міграції для PostgreSQL
cd src/CampusSwap.WebApi
dotnet ef migrations add InitialCreate
dotnet ef database update

# 4. Запустити проект
dotnet run
```

**Примітка:** Обидві connection strings вже налаштовані в `appsettings.json`:
- PostgreSQL: `"Host=localhost;Database=campusswap_db;Username=denys;Password="`
- SQLite: `"Data Source=campusswap.db"`

## 🔍 Де що шукати

### Додати нову сутність:
1. Створити клас в `Domain/Entities/`
2. Додати DbSet в `Infrastructure/Data/ApplicationDbContext.cs`
3. Створити конфігурацію в `Infrastructure/Data/Configurations/`
4. Згенерувати міграцію: `dotnet ef migrations add AddNewEntity`

### Додати новий API ендпоінт:
1. Створити Command/Query в `Application/Features/[Feature]/`
2. Створити Handler там же
3. Додати метод в контролер `WebApi/Controllers/`

### Додати нову сторінку на фронтенді:
1. Створити компонент в `client/src/pages/`
2. Додати роут в `client/src/App.tsx`
3. Додати посилання в `client/src/components/Header.tsx`

### Змінити стилі:
- Глобальні стилі: `client/src/styles/globals.css`
- Tailwind конфіг: `client/tailwind.config.js`
- Компонент стилі: використовуй Tailwind класи прямо в JSX

## 📊 База даних

### Основні таблиці:
- **Users** - користувачі (email, password hash, university)
- **Listings** - оголошення (title, description, price, category)
- **Orders** - замовлення (buyer, seller, status, meeting location)
- **Messages** - повідомлення (sender, receiver, content)
- **Conversations** - розмови (participants, last message)
- **SavedListings** - збережені оголошення (user, listing)
- **RefreshTokens** - токени оновлення (token, expiry, user)

## 🧪 Тестування

```bash
# Backend тести (77+ тестів)
dotnet test

# Тільки Domain тести
dotnet test tests/CampusSwap.Domain.Tests

# Тільки Integration тести
dotnet test tests/CampusSwap.Integration.Tests

# Frontend тести
cd client
npm test

# Coverage звіт
dotnet test --collect:"XPlat Code Coverage"
```

## 🔐 API Endpoints

### Аутентифікація
- `POST /api/auth/register` - реєстрація
- `POST /api/auth/login` - вхід
- `POST /api/auth/refresh` - оновлення токену
- `POST /api/auth/logout` - вихід

### Оголошення
- `GET /api/listings` - всі оголошення (фільтри: category, minPrice, maxPrice, search)
- `GET /api/listings/{id}` - деталі оголошення
- `POST /api/listings` - створити (потрібна авторизація)
- `PUT /api/listings/{id}` - оновити (тільки власник)
- `DELETE /api/listings/{id}` - видалити (тільки власник)
- `GET /api/listings/my` - мої оголошення
- `GET /api/listings/saved` - збережені

### Замовлення
- `POST /api/orders` - створити замовлення
- `GET /api/orders/my` - мої замовлення
- `PUT /api/orders/{id}/confirm` - підтвердити
- `PUT /api/orders/{id}/complete` - завершити
- `PUT /api/orders/{id}/cancel` - скасувати

### Чат
- `GET /api/chat/conversations` - всі розмови
- `GET /api/chat/conversations/{id}/messages` - повідомлення
- `POST /api/chat/messages` - надіслати повідомлення
- SignalR Hub: `/hubs/chat` - real-time повідомлення

## 🛠 Корисні команди

```bash
# EF Core міграції
dotnet ef migrations add MigrationName
dotnet ef database update
dotnet ef database drop

# Запуск з hot reload
dotnet watch run

# Очистити кеш
dotnet clean
npm cache clean --force

# Оновити пакети
dotnet list package --outdated
npm outdated
```

## 📝 Swagger API документація
http://localhost:5001/swagger

## 🐛 Вирішення проблем

### Помилка з портами
```bash
# Знайти процес на порті
lsof -i :5001
# Вбити процес
kill -9 [PID]
```

### Помилка з БД
```bash
# Перестворити БД
dotnet ef database drop
dotnet ef database update
```

### Помилка з node_modules
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```