#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация
const CONTRACT_FILE = 'contracts/PongTournamentScores.sol';
const OUTPUT_FILE = 'src/blockchain/contractConfig.ts';
const BUILD_DIR = 'build';

// Проверка и установка solc
function ensureSolcInstalled() {
    try {
        execSync('solc --version', { stdio: 'pipe' });
        console.log('✓ Solidity compiler найден');
        return true;
    } catch (error) {
        console.log('⚠ Solidity compiler не найден. Устанавливаю локально...');
        try {
            // Устанавливаем solc локально в проект
            execSync('npm install solc@0.8.19', { stdio: 'inherit' });
            console.log('✓ Solidity compiler установлен локально');
            return true;
        } catch (installError) {
            console.error('❌ Ошибка установки solc:', installError.message);
            return false;
        }
    }
}

// Компиляция контракта
function compileContract() {
    console.log('🔨 Компилирую контракт...');

    try {
        // Пробуем использовать локальный solc из node_modules
        const localSolc = path.join('node_modules', '.bin', 'solc');
        let solcCommand = 'solc';

        if (fs.existsSync(localSolc)) {
            solcCommand = localSolc;
            console.log('Используется локальный solc');
        }

        // Создаем папку build
        if (!fs.existsSync(BUILD_DIR)) {
            fs.mkdirSync(BUILD_DIR, { recursive: true });
        }

        // Компилируем контракт
        const command = `${solcCommand} --optimize --abi --bin --output-dir ${BUILD_DIR} ${CONTRACT_FILE}`;
        execSync(command, { stdio: 'pipe' });

        console.log('✓ Контракт скомпилирован');
        return true;

    } catch (error) {
        // Если системный/локальный solc не работает, пробуем через Node.js API
        console.log('⚠ Системный solc не работает, пробую Node.js API...');
        return compileWithNodeAPI();
    }
}

// Компиляция через Node.js API
function compileWithNodeAPI() {
    try {
        const solc = require('solc');

        // Читаем исходный код контракта
        const source = fs.readFileSync(CONTRACT_FILE, 'utf8');

        // Настройки компиляции
        const input = {
            language: 'Solidity',
            sources: {
                'PongTournamentScores.sol': {
                    content: source
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                },
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        };

        // Компилируем
        const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

        // Проверяем ошибки
        if (compiled.errors) {
            const errors = compiled.errors.filter(error => error.severity === 'error');
            if (errors.length > 0) {
                console.error('❌ Ошибки компиляции:');
                errors.forEach(error => console.error(error.formattedMessage));
                return false;
            }
        }

        // Извлекаем результаты
        const contract = compiled.contracts['PongTournamentScores.sol']['PongTournamentScores'];
        const abi = contract.abi;
        const bytecode = '0x' + contract.evm.bytecode.object;

        // Создаем папку build и сохраняем файлы
        if (!fs.existsSync(BUILD_DIR)) {
            fs.mkdirSync(BUILD_DIR, { recursive: true });
        }

        fs.writeFileSync(path.join(BUILD_DIR, 'PongTournamentScores.abi'), JSON.stringify(abi, null, 2));
        fs.writeFileSync(path.join(BUILD_DIR, 'PongTournamentScores.bin'), contract.evm.bytecode.object);

        console.log('✓ Контракт скомпилирован через Node.js API');
        return true;

    } catch (error) {
        console.error('❌ Ошибка компиляции через Node.js API:', error.message);
        return false;
    }
}

// Чтение скомпилированных файлов
function readCompiledFiles() {
    const abiFile = path.join(BUILD_DIR, 'PongTournamentScores.abi');
    const binFile = path.join(BUILD_DIR, 'PongTournamentScores.bin');

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

// Генерация TypeScript конфигурации
function generateTypeScriptConfig(abi, bytecode) {
    const timestamp = new Date().toISOString();
    const content = `// Автоматически сгенерировано из ${CONTRACT_FILE}
// Дата генерации: ${timestamp}
// Не редактируйте этот файл вручную - используйте npm run compile-contract

export const PongTournamentScoresABI = ${JSON.stringify(abi, null, 4)};

export const PongTournamentScoresBytecode = "${bytecode}";
`;

    try {
        // Создаем директорию если её нет
        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

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
    console.log('🚀 Компиляция смарт-контракта Solidity');
    console.log('='.repeat(50));

    // Проверяем наличие контракта
    if (!fs.existsSync(CONTRACT_FILE)) {
        console.error(`❌ Файл контракта не найден: ${CONTRACT_FILE}`);
        process.exit(1);
    }

    // Проверяем и устанавливаем solc
    if (!ensureSolcInstalled()) {
        process.exit(1);
    }

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
    console.log('✅ Компиляция завершена успешно!');
    console.log(`📁 ABI и байткод обновлены в ${OUTPUT_FILE}`);
    console.log(`🗂️  Промежуточные файлы сохранены в ${BUILD_DIR}/`);
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { main };
