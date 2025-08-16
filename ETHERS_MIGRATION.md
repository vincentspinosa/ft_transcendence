# Замена методов расшифровки в блокчейне на ethers

## Внесенные изменения:

### 1. Обновление импортов
- **Заменено**: `import { keccak256 } from 'js-sha3';`
- **На**: `import { ethers } from 'ethers';`

### 2. Новый метод кодирования с ethers
Заменил самописный метод `encodeCall()` на версию, использующую ethers.js:

```typescript
private encodeCall(functionName: string, types: string[], values: string[]): string {
    // Создание ABI фрагмента для функции
    const abiFragment = {
        name: functionName,
        type: 'function',
        inputs: types.map((type, index) => ({
            name: `param${index}`,
            type: type
        }))
    };

    // Создание интерфейса с функцией
    const iface = new ethers.Interface([abiFragment]);
    
    // Конвертация значений в подходящие типы
    const convertedValues = values.map((value, index) => {
        const type = types[index];
        if (type === 'uint256') {
            return ethers.parseUnits(value, 0); // Парсинг как integer
        } else if (type === 'bool') {
            return value === 'true' || value === '1';
        } else if (type === 'address') {
            return ethers.getAddress(value); // Валидация и checksum адреса
        }
        return value; // string и другие типы
    });

    // Кодирование вызова функции
    const encoded = iface.encodeFunctionData(functionName, convertedValues);
    return encoded;
}
```

### 3. Новый метод декодирования с ethers
Добавил метод декодирования результатов с использованием ethers:

```typescript
private decodeResult(result: string, returnTypes: string[]): any {
    // Для простых типов используем ethers AbiCoder
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decoded = abiCoder.decode(returnTypes, result);
    
    return decoded.length === 1 ? decoded[0] : decoded;
}
```

### 4. Обновленные методы блокчейн-сервиса

#### `getPlayerScore()`:
- Использует ethers для кодирования вызова
- Использует ethers для декодирования uint256 результата
- Правильно обрабатывает BigInt результаты

#### `getPlayerName()`:
- Использует ethers для кодирования вызова
- Использует ethers для декодирования string результата
- Fallback к legacy методу при ошибках

#### `getAllUniquePlayersWithStats()`:
- Использует ethers для кодирования вызова
- Пытается использовать ethers для декодирования сложных массивов
- Fallback к legacy методу `decodeMultipleArraysResult()` при ошибках

### 5. Преимущества новой системы:

1. **Стандартизация**: Использование проверенной библиотеки ethers
2. **Надежность**: Меньше ошибок при кодировании/декодировании
3. **Совместимость**: Лучшая совместимость с Ethereum стандартами
4. **Валидация**: Автоматическая валидация адресов и типов
5. **Fallback**: Сохранена поддержка legacy методов для совместимости

### 6. Функции с Fallback логикой:

- Для сложных типов данных (массивы) сохранена legacy поддержка
- При ошибках ethers автоматически используется старый метод
- Это обеспечивает совместимость со старыми контрактами

## Результат:

✅ Полная совместимость с ethers.js
✅ Сохранена обратная совместимость  
✅ Улучшена надежность кодирования/декодирования
✅ Автоматическая валидация типов данных
✅ Лучшая обработка BigInt и других типов Ethereum
