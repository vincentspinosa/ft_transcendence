#!/usr/bin/env python3
"""
Скрипт для компиляции Solidity контрактов и генерации TypeScript конфигурации
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Конфигурация
CONTRACT_FILE = "contracts/PongTournamentScores.sol"
OUTPUT_FILE = "src/blockchain/contractConfig.ts"
BUILD_DIR = "build"

def ensure_solc_installed():
    """Проверяет и устанавливает solc если необходимо"""
    try:
        subprocess.run(["solc", "--version"], capture_output=True, check=True)
        print("✓ Solidity compiler найден")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠ Solidity compiler не найден")
        return install_solc()

def install_solc():
    """Устанавливает solc через pip"""
    try:
        print("📦 Устанавливаю py-solc-x...")
        subprocess.run([sys.executable, "-m", "pip", "install", "py-solc-x"], check=True)
        
        # Импортируем и устанавливаем solc
        from solcx import install_solc, set_solc_version
        
        print("📦 Устанавливаю Solidity 0.8.19...")
        install_solc('0.8.19')
        set_solc_version('0.8.19')
        
        print("✓ Solidity compiler установлен")
        return True
    except Exception as e:
        print(f"❌ Ошибка установки solc: {e}")
        return False

def compile_contract():
    """Компилирует контракт и возвращает ABI и байткод"""
    print("🔨 Компилирую контракт...")
    
    try:
        from solcx import compile_files
        
        # Компилируем файл
        compiled = compile_files([CONTRACT_FILE])
        
        # Получаем ключ контракта (например: contracts/PongTournamentScores.sol:PongTournamentScores)
        contract_key = None
        for key in compiled.keys():
            if "PongTournamentScores" in key:
                contract_key = key
                break
        
        if not contract_key:
            raise Exception("Контракт PongTournamentScores не найден в скомпилированных файлах")
        
        contract = compiled[contract_key]
        abi = contract['abi']
        bytecode = '0x' + contract['bin']
        
        print("✓ Контракт скомпилирован")
        return abi, bytecode
        
    except ImportError:
        print("❌ py-solc-x не установлен. Пытаюсь использовать системный solc...")
        return compile_with_system_solc()
    except Exception as e:
        print(f"❌ Ошибка компиляции: {e}")
        return None, None

def compile_with_system_solc():
    """Компилирует контракт используя системный solc"""
    try:
        # Создаем папку build
        os.makedirs(BUILD_DIR, exist_ok=True)
        
        # Компилируем контракт
        cmd = [
            "solc",
            "--optimize",
            "--abi",
            "--bin",
            "--output-dir", BUILD_DIR,
            CONTRACT_FILE
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Читаем результаты
        abi_file = os.path.join(BUILD_DIR, "PongTournamentScores.abi")
        bin_file = os.path.join(BUILD_DIR, "PongTournamentScores.bin")
        
        if not os.path.exists(abi_file) or not os.path.exists(bin_file):
            raise Exception("Скомпилированные файлы не найдены")
        
        with open(abi_file, 'r') as f:
            abi = json.load(f)
        
        with open(bin_file, 'r') as f:
            bytecode = '0x' + f.read().strip()
        
        return abi, bytecode
        
    except Exception as e:
        print(f"❌ Ошибка компиляции с системным solc: {e}")
        return None, None

def generate_typescript_config(abi, bytecode):
    """Генерирует TypeScript конфигурационный файл"""
    content = f"""// Автоматически сгенерировано из {CONTRACT_FILE}
// Не редактируйте этот файл вручную - используйте npm run compile-contract

export const PongTournamentScoresABI = {json.dumps(abi, indent=4)};

export const PongTournamentScoresBytecode = "{bytecode}";
"""
    
    try:
        # Создаем директорию если её нет
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        with open(OUTPUT_FILE, 'w') as f:
            f.write(content)
        
        print(f"✓ Конфигурация сохранена в {OUTPUT_FILE}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка записи файла: {e}")
        return False

def main():
    """Основная функция"""
    print("🚀 Генерация ABI и байткода для смарт-контракта")
    print("=" * 50)
    
    # Проверяем наличие контракта
    if not os.path.exists(CONTRACT_FILE):
        print(f"❌ Файл контракта не найден: {CONTRACT_FILE}")
        sys.exit(1)
    
    # Проверяем и устанавливаем solc
    if not ensure_solc_installed():
        sys.exit(1)
    
    # Компилируем контракт
    abi, bytecode = compile_contract()
    if not abi or not bytecode:
        sys.exit(1)
    
    # Генерируем TypeScript конфигурацию
    if not generate_typescript_config(abi, bytecode):
        sys.exit(1)
    
    print("=" * 50)
    print("✅ Генерация завершена успешно!")
    print(f"📁 ABI и байткод обновлены в {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
