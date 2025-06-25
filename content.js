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
      throw new Error(chrome.i18n.getMessage('unsupportedEngine') || '不支持的翻译引擎');
    }
  } catch (error) {
    console.error('翻译失败:', error);
    // 提供更详细的错误信息
    if (error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    } else if (error.message.includes('403')) {
      throw new Error('API密钥无效或已过期');
    } else if (error.message.includes('429')) {
      throw new Error('API调用频率过高，请稍后重试');
    } else if (error.message.includes('400')) {
      throw new Error('请求参数错误，请检查目标语言设置');
    }
    throw error;
  }
}

// 使用Google翻译API
async function translateWithGoogle(text) {
  // 如果有API密钥，使用官方API
  if (translationSettings.apiKey && translationSettings.apiKey.trim()) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${translationSettings.apiKey}`;
    
    try {
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Google API错误: ${errorMessage}`);
      }
      
      const data = await response.json();
      if (!data.data || !data.data.translations || !data.data.translations[0]) {
        throw new Error('Google API返回数据格式错误');
      }
      return data.data.translations[0].translatedText;
    } catch (error) {
      if (error.message.includes('Google API错误')) {
        throw error;
      }
      throw new Error(`Google翻译请求失败: ${error.message}`);
    }
  } else {
    // 没有API密钥时的提示
    throw new Error('请在设置中配置Google翻译API密钥，或选择其他翻译引擎');
  }
}

// 使用DeepL翻译API
async function translateWithDeepL(text) {
  if (!translationSettings.apiKey || !translationSettings.apiKey.trim()) {
    throw new Error('请在设置中配置DeepL API密钥');
  }
  
  const url = 'https://api-free.deepl.com/v2/translate';
  
  try {
    const formData = new URLSearchParams();
    formData.append('auth_key', translationSettings.apiKey);
    formData.append('text', text);
    formData.append('target_lang', translationSettings.targetLanguage.toUpperCase());
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP ${response.status}`;
      throw new Error(`DeepL API错误: ${errorMessage}`);
    }
    
    const data = await response.json();
    if (!data.translations || !data.translations[0]) {
      throw new Error('DeepL API返回数据格式错误');
    }
    return data.translations[0].text;
  } catch (error) {
    if (error.message.includes('DeepL API错误')) {
      throw error;
    }
    throw new Error(`DeepL翻译请求失败: ${error.message}`);
  }
}