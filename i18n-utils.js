// 国际化工具函数

// 获取用户浏览器语言并映射到支持的语言
function getUserPreferredLanguage() {
  const browserLanguage = chrome.i18n.getUILanguage();
  
  // 语言映射表 - 将浏览器语言映射到翻译目标语言
  const languageMapping = {
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW', 
    'zh': 'zh-CN',
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'ar': 'ar',
    'th': 'th',
    'vi': 'vi',
    'hi': 'hi',
    'tr': 'tr'
  };
  
  // 首先尝试完全匹配
  if (languageMapping[browserLanguage]) {
    return languageMapping[browserLanguage];
  }
  
  // 如果没有完全匹配，尝试匹配语言代码的前两位
  const primaryLanguage = browserLanguage.split('-')[0];
  if (languageMapping[primaryLanguage]) {
    return languageMapping[primaryLanguage];
  }
  
  // 默认返回英语
  return 'en';
}

// 初始化用户首选语言设置
function initializeUserLanguagePreference() {
  chrome.storage.sync.get(['targetLanguage', 'isFirstRun'], function(result) {
    // 如果是首次运行或者没有设置目标语言
    if (result.isFirstRun !== false || !result.targetLanguage) {
      const preferredLanguage = getUserPreferredLanguage();
      
      chrome.storage.sync.set({
        targetLanguage: preferredLanguage,
        isFirstRun: false
      });
    }
  });
}

// 获取本地化消息的辅助函数
function getLocalizedMessage(key, substitutions = []) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// 检测用户界面语言方向（LTR/RTL）
function getTextDirection() {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const currentLanguage = chrome.i18n.getUILanguage().split('-')[0];
  return rtlLanguages.includes(currentLanguage) ? 'rtl' : 'ltr';
}

// 应用文本方向到页面
function applyTextDirection() {
  document.documentElement.dir = getTextDirection();
}

// 导出函数（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getUserPreferredLanguage,
    initializeUserLanguagePreference,
    getLocalizedMessage,
    getTextDirection,
    applyTextDirection
  };
}