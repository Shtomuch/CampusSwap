# CampusSwap

Cтудентський маркетплейс для купівлі та продажу використаних підручників і речей.  
Платформа поєднує **онлайн-чат** для зручного спілкування та **маркетплейс** для продажу, купівлі й торгів із гнучкими фільтрами та пошуком — угоди відбуваються швидко, просто й прозоро.

---

## Зміст

- [Вимоги](#вимоги)
- [Архітектура та документація](#архітектура-та-документація)
- [Швидкий старт (локально)](#швидкий-старт-локально)
  - [PostgreSQL](#postgresql)
  - [Налаштування оточення](#налаштування-оточення)
  - [Запуск](#запуск)

## Вимоги

- .NET SDK **8.x**
- Node.js **18+** / **20+** (LTS)
- PostgreSQL **14+**
- (Опц.) Docker & Docker Compose

---

## Архітектура та документація

- Призначення продукту та огляд: `docs/architecture.md`
- Типові сценарії: `docs/use-cases.md`
- Діаграми (Mermaid/PlantUML/draw.io): `docs/diagrams/*`

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
