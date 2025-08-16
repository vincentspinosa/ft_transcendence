#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
    // Проверяем наличие solc
    let solc;
    try {
        solc = require('solc');
    } catch (error) {
        console.log('⚠ Устанавливаю solc...');
        require('child_process').execSync('npm install solc@0.8.19', {
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '../../../')
        });
        solc = require('solc');
    }

    console.log('🔨 Компилирую контракт...');

    // Читаем контракт
    const contractPath = path.resolve(__dirname, '../contracts/PongTournamentScores.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    // Компилируем
    const compiled = JSON.parse(solc.compile(JSON.stringify({
        language: 'Solidity',
        sources: { 'PongTournamentScores.sol': { content: source } },
        settings: {
            outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
            optimizer: { enabled: true, runs: 200 }
        }
    })));

    // Проверяем ошибки
    const errors = compiled.errors?.filter(e => e.severity === 'error') || [];
    if (errors.length > 0) {
        console.error('❌ Ошибки компиляции:');
        errors.forEach(e => console.error(e.formattedMessage));
        process.exit(1);
    }

    // Извлекаем результаты
    const contract = compiled.contracts['PongTournamentScores.sol']['PongTournamentScores'];
    const abi = contract.abi;
    const bytecode = '0x' + contract.evm.bytecode.object;

    // Сохраняем файлы build
    const buildDir = path.resolve(__dirname, '../../../build');
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, 'PongTournamentScores.abi'), JSON.stringify(abi, null, 2));
    fs.writeFileSync(path.join(buildDir, 'PongTournamentScores.bin'), contract.evm.bytecode.object);

    // Генерируем TypeScript конфигурацию
    const configContent = `// Автоматически сгенерировано ${new Date().toISOString()}
export const PongTournamentScoresABI = ${JSON.stringify(abi)};
export const PongTournamentScoresBytecode = "${bytecode}";
`;

    const configPath = path.resolve(__dirname, '../contractConfig.ts');
    fs.writeFileSync(configPath, configContent, 'utf8');

    console.log('✅ Компиляция завершена успешно!');

} catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
}
