# Компиляция смарт-контрактов

## Обзор

В проекте реализована автоматическая компиляция Solidity контрактов и генерация TypeScript конфигурации. Это обеспечивает актуальность ABI и байткода без необходимости ручного копирования.

## Файлы

- `contracts/PongTournamentScores.sol` - исходный Solidity контракт
- `scripts/compile-contract.js` - единый скрипт компиляции с автоматической установкой зависимостей
- `src/blockchain/contractConfig.ts` - автоматически генерируемый файл с ABI и байткодом

## Использование

```bash
# Через npm (рекомендуется)
npm run compile-contract

# Через make
make compile-contract

# Напрямую
node scripts/compile-contract.js
```

## Как это работает

1. **Автоматическая установка**: Скрипт проверяет наличие Solidity компилятора и устанавливает его локально при необходимости
2. **Многоуровневая компиляция**: 
   - Сначала пробует системный `solc`
   - Затем локальный `solc` из `node_modules`
   - В крайнем случае использует Node.js API `solc` пакета
3. **Генерация файлов**: Создает промежуточные файлы в `build/` и финальную TypeScript конфигурацию

## Зависимости

Скрипт автоматически установит необходимые зависимости:
- `solc@0.8.19` - Solidity compiler для Node.js

## Результат компиляции

После запуска скрипта:

1. Компилируется контракт `contracts/PongTournamentScores.sol`
2. Создаются промежуточные файлы в `build/`:
   - `PongTournamentScores.abi`
   - `PongTournamentScores.bin`
3. Генерируется файл `src/blockchain/contractConfig.ts` с экспортированными константами:
   - `PongTournamentScoresABI`
   - `PongTournamentScoresBytecode`

## Важные замечания

- ⚠️ **НЕ редактируйте** файл `src/blockchain/contractConfig.ts` вручную
- Всегда используйте скрипт компиляции после изменения контракта
- Файл `contractConfig.ts` содержит метку времени генерации
- Папка `build/` создается автоматически для промежуточных файлов

## Интеграция в CI/CD

```bash
# Компиляция контрактов перед сборкой
npm run compile-contract
npm run build
```

## Структура проекта

```
ft_transcendence/
├── contracts/
│   └── PongTournamentScores.sol     # Исходный контракт
├── scripts/
│   └── compile-contract.js          # Единый скрипт компиляции
├── src/blockchain/
│   └── contractConfig.ts            # Автогенерированная конфигурация
└── build/                           # Промежуточные файлы компиляции
    ├── PongTournamentScores.abi
    └── PongTournamentScores.bin
```
