# FormTranslator 多语言支持说明

## 概述

FormTranslator 插件现已支持多语言界面，能够根据用户浏览器的语言设置自动显示相应的界面语言。

## 支持的语言

目前支持以下语言：

- **中文 (简体)** - `zh_CN`
- **英文** - `en` (默认语言)
- **日文** - `ja`

## 实现原理

### 1. Chrome 扩展国际化标准

插件采用 Chrome 扩展的标准国际化机制：

- 使用 `_locales` 文件夹存储不同语言的翻译文件
- 每种语言对应一个 `messages.json` 文件
- 在 `manifest.json` 中设置 `default_locale`
- 使用 `chrome.i18n.getMessage()` API 获取本地化文本

### 2. 文件结构

```
_locales/
├── en/
│   └── messages.json     # 英文翻译
├── zh_CN/
│   └── messages.json     # 中文翻译
└── ja/
    └── messages.json     # 日文翻译
```

### 3. 自动语言检测

插件会在首次安装时自动检测用户浏览器语言：

- 使用 `chrome.i18n.getUILanguage()` 获取浏览器UI语言
- 根据语言映射表设置合适的默认翻译目标语言
- 支持完全匹配和主语言匹配（如 `en-US` → `en`）

## 语言映射规则

插件会根据用户的浏览器语言自动设置默认的翻译目标语言：

| 浏览器语言 | 默认翻译目标 | 说明 |
|-----------|-------------|------|
| 中文 (zh-CN, zh-TW, zh) | 中文 | 中文用户保持中文 |
| 英文 (en, en-US, en-GB) | 中文 | 英文用户默认翻译为中文 |
| 日文 (ja) | 英文 | 日文用户默认翻译为英文 |
| 其他语言 | 英文 | 其他语言用户默认翻译为英文 |

## 使用方法

### 用户使用

1. **自动语言检测**：插件会自动检测浏览器语言并显示相应界面
2. **手动切换**：用户可以在浏览器设置中更改语言偏好
3. **重新加载**：更改语言设置后，重新加载插件页面即可看到新语言

### 开发者使用

#### 在 HTML 中使用

```html
<!-- 使用 data-i18n 属性 -->
<h1 data-i18n="popupTitle"></h1>
<button data-i18n="translateButton"></button>

<!-- 使用 data-i18n-placeholder 属性 -->
<input data-i18n-placeholder="apiKeyPlaceholder" type="text">
```

#### 在 JavaScript 中使用

```javascript
// 获取本地化消息
const message = chrome.i18n.getMessage('messageKey');

// 带参数的消息
const messageWithParams = chrome.i18n.getMessage('messageKey', ['param1', 'param2']);

// 初始化页面国际化
function initializeI18n() {
  // 处理 data-i18n 属性
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });
  
  // 处理 data-i18n-placeholder 属性
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.placeholder = message;
    }
  });
}
```

## 添加新语言

要添加新的语言支持：

1. **创建语言文件夹**：在 `_locales` 下创建新的语言文件夹（如 `fr` 表示法语）

2. **创建 messages.json**：复制现有的 `messages.json` 文件并翻译所有消息

3. **更新语言映射**：在 `background.js` 和 `i18n-utils.js` 中添加新语言的映射规则

4. **测试**：使用 `test-i18n.html` 测试新语言的显示效果

### 示例：添加法语支持

1. 创建 `_locales/fr/messages.json`：

```json
{
  "extensionName": {
    "message": "FormTranslator",
    "description": "Nom de l'extension"
  },
  "extensionDescription": {
    "message": "Extension Chrome pour traduire le contenu des formulaires web en un clic",
    "description": "Description de l'extension"
  }
  // ... 其他消息
}
```

2. 更新语言映射：

```javascript
const languageMapping = {
  // ... 现有映射
  'fr': 'en',
  'fr-FR': 'en'
};
```

## 测试多语言功能

1. **使用测试页面**：打开 `test-i18n.html` 查看当前语言环境

2. **切换浏览器语言**：
   - 打开 Chrome 设置 → 高级 → 语言
   - 添加或重新排序语言
   - 重启浏览器或重新加载插件

3. **验证界面**：检查插件的弹窗和设置页面是否显示正确语言

## 注意事项

1. **默认语言**：`manifest.json` 中的 `default_locale` 设置为 `en`

2. **回退机制**：如果某个消息键在当前语言中不存在，会回退到默认语言

3. **参数化消息**：支持带参数的消息，使用 `$1$`, `$2$` 等占位符

4. **特殊字符**：JSON 文件中需要正确转义特殊字符

5. **缓存问题**：更改语言文件后可能需要重新加载插件

## 故障排除

### 常见问题

1. **消息不显示**：检查消息键是否正确，JSON 格式是否有效

2. **语言不切换**：确认浏览器语言设置，重新加载插件

3. **部分文本未翻译**：检查是否有遗漏的硬编码文本

### 调试方法

```javascript
// 检查当前UI语言
console.log('UI Language:', chrome.i18n.getUILanguage());

// 检查消息是否存在
console.log('Message:', chrome.i18n.getMessage('messageKey'));

// 列出所有可用消息（开发环境）
Object.keys(chrome.i18n.getMessages()).forEach(key => {
  console.log(key, chrome.i18n.getMessage(key));
});
```

## 贡献指南

欢迎贡献新的语言翻译：

1. Fork 项目
2. 添加新语言的 `messages.json` 文件
3. 更新相关的语言映射代码
4. 测试翻译质量和界面显示
5. 提交 Pull Request

请确保翻译准确、自然，符合目标语言的表达习惯。