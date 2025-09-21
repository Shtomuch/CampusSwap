# CampusSwap

Cтудентський маркетплейс для купівлі та продажу використаних підручників та речей.
Платформа поєднує онлайн-чат для зручного спілкування між користувачами та маркетплейс для продажу, купівлі й торгівлі товарами з гнучкими фільтрами та інструментами пошуку. Це створює єдиний простір, де комунікація та угоди відбуваються швидко, просто й прозоро.

## Швидкий старт

### PostgreSQL

```bash
createdb campusswap_db
```

Оновити `src/CampusSwap.WebApi/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=campusswap_db;Username=denys;Password="
}
```

### Запуск

```bash
# Backend
cd src/CampusSwap.WebApi
dotnet ef database update
dotnet run

# Frontend (нове вікно терміналу)
cd client
npm install
npm start
```

Backend: http://localhost:5001
Frontend: http://localhost:3001

### Тести

```bash
# Backend тести
dotnet test

# Frontend тести
cd client
npm test
```
