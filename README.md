# CampusSwap

Cтудентський маркетплейс для купівлі та продажу використаних підручників і речей.  
Платформа поєднує **онлайн-чат** для зручного спілкування та **маркетплейс** для продажу, купівлі й торгів із гнучкими фільтрами та пошуком — угоди відбуваються швидко, просто й прозоро.

---

## Зміст

## Зміст

- [Вимоги](#вимоги) – необхідне програмне забезпечення та версії середовища.
- [Архітектура та документація](#архітектура-та-документація) – посилання на додаткові файли з описом системи, сценаріїв і діаграм.
- [Швидкий старт](#швидкий-старт) – інструкції для локального запуску.
  - [PostgreSQL](#postgresql) – створення бази даних.
  - [Запуск](#запуск) – як запустити backend та frontend.
  - [Тести](#тести) – як запустити модульні й інтеграційні тести.

---

## Вимоги

- .NET SDK **8.x**
- Node.js **18+** / **20+** (LTS)
- PostgreSQL **14+**
- (Опц.) Docker & Docker Compose

---

## Архітектура та документація

- Призначення продукту та огляд: `docs/architecture.md`
- Типові сценарії: `docs/use-cases.md`

> Швидке посилання:
>
> - [🎯 Use Cases](docs/use-cases.md)

---

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
