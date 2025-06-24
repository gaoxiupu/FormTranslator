// 全局变量，存储翻译设置
let translationSettings = {
  engine: 'google', // 默认使用Google翻译
  targetLanguage: 'zh-CN', // 默认目标语言为中文
  apiKey: '' // API密钥，从存储中获取
};

// 初始化时从存储中获取设置
chrome.storage.sync.get(['engine', 'targetLanguage', 'googleApiKey', 'deeplApiKey'], function(result) {
  if (result.engine) translationSettings.engine = result.engine;
  if (result.targetLanguage) translationSettings.targetLanguage = result.targetLanguage;
  
  // 根据选择的引擎设置API密钥
  if (translationSettings.engine === 'google' && result.googleApiKey) {
    translationSettings.apiKey = result.googleApiKey;
  } else if (translationSettings.engine === 'deepl' && result.deeplApiKey) {
    translationSettings.apiKey = result.deeplApiKey;
  }
});

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'translateForm') {
    translateFormElements()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, message: error.message}));
    return true; // 异步响应
  } else if (request.action === 'updateSettings') {
    // 更新设置
    if (request.settings) {
      translationSettings = {...translationSettings, ...request.settings};
      sendResponse({success: true});
    }
  }
});



// 翻译表单元素
async function translateFormElements() {
  // 获取所有表单元素
  const formElements = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], select');
  
  if (formElements.length === 0) {
    return {success: false, message: chrome.i18n.getMessage('noFormElements'), count: 0};
  }
  
  let translatedCount = 0;
  let failedCount = 0;
  
  // 创建一个临时的状态指示器
  const statusIndicator = createStatusIndicator();
  
  try {
    // 遍历所有表单元素
    for (const element of formElements) {
      // 跳过空元素或已有值的元素
      if (!element.value.trim()) continue;
      
      try {
        // 获取元素的当前值
        const originalText = element.value;
        
        // 更新状态
        updateStatusIndicator(statusIndicator, chrome.i18n.getMessage('translating') + ` (${translatedCount}/${formElements.length})...`);
        
        // 翻译文本
        const translatedText = await translateText(originalText);
        
        // 如果翻译成功，更新元素值
        if (translatedText && translatedText !== originalText) {
          element.value = translatedText;
          // 触发input事件，确保表单验证和其他事件能够响应
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          translatedCount++;
        }
      } catch (error) {
        console.error('翻译元素失败:', error);
        failedCount++;
      }
    }
    
    // 更新最终状态
    if (translatedCount > 0) {
      updateStatusIndicator(statusIndicator, chrome.i18n.getMessage('translationComplete', [translatedCount.toString()]), 'success');
    } else {
      updateStatusIndicator(statusIndicator, chrome.i18n.getMessage('noElementsToTranslate'), 'info');
    }
    
    // 3秒后移除状态指示器
    setTimeout(() => {
      document.body.removeChild(statusIndicator);
    }, 3000);
    
    return {
      success: true,
      count: translatedCount,
      failed: failedCount
    };
  } catch (error) {
    console.error('翻译表单失败:', error);
    updateStatusIndicator(statusIndicator, `翻译失败: ${error.message}`, 'error');
    
    // 3秒后移除状态指示器
    setTimeout(() => {
      document.body.removeChild(statusIndicator);
    }, 3000);
    
    return {
      success: false,
      message: error.message,
      count: translatedCount
    };
  }
}

// 创建状态指示器
function createStatusIndicator() {
  const indicator = document.createElement('div');
  indicator.style.position = 'fixed';
  indicator.style.top = '20px';
  indicator.style.right = '20px';
  indicator.style.padding = '10px 15px';
  indicator.style.background = 'rgba(0, 0, 0, 0.7)';
  indicator.style.color = 'white';
  indicator.style.borderRadius = '5px';
  indicator.style.zIndex = '9999';
  indicator.style.fontSize = '14px';
  indicator.style.fontFamily = 'Arial, sans-serif';
  indicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  indicator.textContent = '准备翻译...';
  document.body.appendChild(indicator);
  return indicator;
}

// 更新状态指示器
function updateStatusIndicator(indicator, message, type = 'info') {
  indicator.textContent = message;
  
  // 根据类型设置不同的样式
  switch (type) {
    case 'success':
      indicator.style.background = 'rgba(40, 167, 69, 0.9)';
      break;
    case 'error':
      indicator.style.background = 'rgba(220, 53, 69, 0.9)';
      break;
    case 'warning':
      indicator.style.background = 'rgba(255, 193, 7, 0.9)';
      indicator.style.color = 'black';
      break;
    default: // info
      indicator.style.background = 'rgba(0, 0, 0, 0.7)';
  }
}

// 翻译文本函数
async function translateText(text) {
  if (!text || text.trim() === '') return text;
  
  try {
    // 根据设置选择翻译引擎
    if (translationSettings.engine === 'google') {
      return await translateWithGoogle(text);
    } else if (translationSettings.engine === 'deepl') {
      return await translateWithDeepL(text);
    } else {
      throw new Error(chrome.i18n.getMessage('unsupportedEngine') || 'Unsupported translation engine');
    }
  } catch (error) {
    console.error('翻译失败:', error);
    throw error;
  }
}

// 使用Google翻译API
async function translateWithGoogle(text) {
  // 如果有API密钥，使用官方API
  if (translationSettings.apiKey) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${translationSettings.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: translationSettings.targetLanguage,
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`${chrome.i18n.getMessage('googleApiError') || 'Google API Error'}: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
  } else {
    // 使用免费的替代方案（不推荐用于生产环境）
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${translationSettings.targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${chrome.i18n.getMessage('googleTranslateError') || 'Google Translate Error'}: ${response.status}`);
    }
    
    const data = await response.json();
    // 提取翻译结果
    let translatedText = '';
    for (const sentence of data[0]) {
      if (sentence[0]) {
        translatedText += sentence[0];
      }
    }
    
    return translatedText;
  }
}

// 使用DeepL翻译API
async function translateWithDeepL(text) {
  if (!translationSettings.apiKey) {
    throw new Error(chrome.i18n.getMessage('deeplApiKeyRequired') || 'DeepL translation requires API key');
  }
  
  const url = 'https://api-free.deepl.com/v2/translate';
  
  const formData = new URLSearchParams();
  formData.append('auth_key', translationSettings.apiKey);
  formData.append('text', text);
  formData.append('target_lang', translationSettings.targetLanguage);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`${chrome.i18n.getMessage('deeplApiError') || 'DeepL API Error'}: ${response.status}`);
  }
  
  const data = await response.json();
  return data.translations[0].text;
}