# Makai

One-line description.

## Local Install

```bash
brew install postgresql@17
brew services start postgresql@17
brew install temporal
createdb makai
git clone [repo url]
cd mkai
npm install
cp .env.example .env
npm run sync
```

## Local Development

```bash
npm run temporal
npm run worker
npm run dev
```