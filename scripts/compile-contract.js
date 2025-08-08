#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация
const CONTRACT_FILE = 'contracts/PongTournamentScores.sol';
const OUTPUT_FILE = 'src/blockchain/contractConfig.ts';
const BUILD_DIR = 'build';

// Функция для проверки и установки solc
function ensureSolcInstalled() {
    try {
        execSync('solc --version', { stdio: 'pipe' });
        console.log('✓ Solidity compiler найден');
    } catch (error) {
        console.log('⚠ Solidity compiler не найден. Устанавливаю...');
        try {
            execSync('npm install -g solc', { stdio: 'inherit' });
            console.log('✓ Solidity compiler установлен');
        } catch (installError) {
            console.error('❌ Ошибка установки solc:', installError.message);
            process.exit(1);
        }
    }
}

// Функция компиляции контракта
function compileContract() {
    console.log('🔨 Компилирую контракт...');

    // Создаем папку build если её нет
    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    try {
        // Компилируем контракт
        const compileCommand = `solc --optimize --abi --bin --output-dir ${BUILD_DIR} ${CONTRACT_FILE}`;
        execSync(compileCommand, { stdio: 'pipe' });
        console.log('✓ Контракт скомпилирован');

        return true;
    } catch (error) {
        console.error('❌ Ошибка компиляции:', error.message);
        return false;
    }
}

// Функция чтения скомпилированных файлов
function readCompiledFiles() {
    const contractName = 'PongTournamentScores';
    const abiFile = path.join(BUILD_DIR, `${contractName}.abi`);
    const binFile = path.join(BUILD_DIR, `${contractName}.bin`);

    if (!fs.existsSync(abiFile) || !fs.existsSync(binFile)) {
        console.error('❌ Скомпилированные файлы не найдены');
        return null;
    }

    try {
        const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
        const bytecode = '0x' + fs.readFileSync(binFile, 'utf8').trim();

        return { abi, bytecode };
    } catch (error) {
        console.error('❌ Ошибка чтения файлов:', error.message);
        return null;
    }
}

// Функция генерации TypeScript файла
function generateTypeScriptConfig(abi, bytecode) {
    const content = `// Автоматически сгенерировано из ${CONTRACT_FILE}
// Не редактируйте этот файл вручную - используйте npm run compile-contract

export const PongTournamentScoresABI = ${JSON.stringify(abi, null, 4)};

export const PongTournamentScoresBytecode = "${bytecode}";
`;

    try {
        fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
        console.log(`✓ Конфигурация сохранена в ${OUTPUT_FILE}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка записи файла:', error.message);
        return false;
    }
}

// Основная функция
function main() {
    console.log('🚀 Генерация ABI и байткода для смарт-контракта');
    console.log('='.repeat(50));

    // Проверяем наличие контракта
    if (!fs.existsSync(CONTRACT_FILE)) {
        console.error(`❌ Файл контракта не найден: ${CONTRACT_FILE}`);
        process.exit(1);
    }

    // Проверяем и устанавливаем solc
    ensureSolcInstalled();

    // Компилируем контракт
    if (!compileContract()) {
        process.exit(1);
    }

    // Читаем результаты компиляции
    const compiled = readCompiledFiles();
    if (!compiled) {
        process.exit(1);
    }

    // Генерируем TypeScript конфигурацию
    if (!generateTypeScriptConfig(compiled.abi, compiled.bytecode)) {
        process.exit(1);
    }

    console.log('='.repeat(50));
    console.log('✅ Генерация завершена успешно!');
    console.log(`📁 ABI и байткод обновлены в ${OUTPUT_FILE}`);
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { main };
