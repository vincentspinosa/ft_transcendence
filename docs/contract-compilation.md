# Генерация ABI и байткода для смарт-контрактов

## Обзор

В проекте реализована автоматическая генерация ABI и байткода для смарт-контрактов из Solidity файлов. Это устраняет необходимость хардкодить эти значения и обеспечивает их актуальность.

## Файлы

- `contracts/PongTournamentScores.sol` - исходный Solidity контракт
- `scripts/compile-contract.py` - Python скрипт для компиляции (рекомендуется)
- `scripts/compile-contract.js` - Node.js скрипт для компиляции (альтернативный)
- `src/blockchain/contractConfig.ts` - автоматически генерируемый файл с ABI и байткодом

## Использование

### Вариант 1: Python скрипт (рекомендуется)
```bash
# Через npm
npm run compile-contract

# Через make
make compile-contract

# Напрямую
python3 scripts/compile-contract.py
```

### Вариант 2: Node.js скрипт
```bash
# Через npm
npm run compile-contract-js

# Напрямую
node scripts/compile-contract.js
```

## Зависимости

### Для Python скрипта:
- Python 3.6+
- pip (для установки py-solc-x)

Скрипт автоматически установит `py-solc-x` и Solidity compiler при первом запуске.

### Для Node.js скрипта:
- Node.js
- solc (Solidity compiler)

Установка solc:
```bash
npm install -g solc
```

## Автоматическая генерация

После запуска любого из скриптов:

1. Компилируется контракт `contracts/PongTournamentScores.sol`
2. Извлекаются ABI и байткод
3. Генерируется файл `src/blockchain/contractConfig.ts` с экспортированными константами:
   - `PongTournamentScoresABI`
   - `PongTournamentScoresBytecode`

## Важные замечания

- ⚠️ **НЕ редактируйте** файл `src/blockchain/contractConfig.ts` вручную
- Всегда используйте скрипты компиляции после изменения контракта
- Файл `contractConfig.ts` содержит комментарий о том, что он автоматически сгенерирован
- Папка `build/` создается автоматически для промежуточных файлов компиляции

## Интеграция в CI/CD

Добавьте в ваш CI/CD pipeline:

```bash
# Компиляция контрактов перед сборкой
make compile-contract
npm run build
```

## Структура проекта

```
ft_transcendence/
├── contracts/
│   └── PongTournamentScores.sol     # Исходный контракт
├── scripts/
│   ├── compile-contract.py          # Python скрипт компиляции
│   └── compile-contract.js          # Node.js скрипт компиляции
├── src/blockchain/
│   └── contractConfig.ts            # Автогенерированная конфигурация
└── build/                           # Промежуточные файлы компиляции
    ├── PongTournamentScores.abi
    └── PongTournamentScores.bin
```
