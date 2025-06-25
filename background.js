// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // 获取用户浏览器语言并设置默认目标语言
    const browserLanguage = chrome.i18n.getUILanguage();
    let defaultTargetLanguage = 'en'; // 默认英语
    
    // 根据浏览器语言设置默认目标语言
    const languageMapping = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW', 
      'zh': 'zh-CN',
      'en': 'zh-CN', // 英语用户默认翻译为中文
      'ja': 'en',
      'ko': 'en',
      'fr': 'en',
      'de': 'en',
      'es': 'en',
      'it': 'en',
      'pt': 'en',
      'ru': 'en'
    };
    
    // 首先尝试完全匹配
    if (languageMapping[browserLanguage]) {
      defaultTargetLanguage = languageMapping[browserLanguage];
    } else {
      // 如果没有完全匹配，尝试匹配语言代码的前两位
      const primaryLanguage = browserLanguage.split('-')[0];
      if (languageMapping[primaryLanguage]) {
        defaultTargetLanguage = languageMapping[primaryLanguage];
      }
    }
    
    // 首次安装时设置默认配置
    chrome.storage.sync.set({
      engine: 'google',
      targetLanguage: defaultTargetLanguage,
      googleApiKey: '',
      deeplApiKey: '',
      isFirstRun: false
    });
    
    // 打开设置页面
    chrome.runtime.openOptionsPage();
  }
});



// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSettings') {
    // 获取存储的设置
    chrome.storage.sync.get(['engine', 'targetLanguage', 'googleApiKey', 'deeplApiKey'], function(result) {
      sendResponse(result);
    });
    return true; // 异步响应
  } else if (request.action === 'saveSettings') {
    // 保存设置
    chrome.storage.sync.set(request.settings, function() {
      if (chrome.runtime.lastError) {
        sendResponse({success: false, error: chrome.runtime.lastError.message});
      } else {
        sendResponse({success: true});
        
        // 通知所有content script更新设置
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'updateSettings',
              settings: request.settings
            }, function() {
              // 忽略错误，因为某些标签页可能没有content script
              if (chrome.runtime.lastError) {
                // 静默处理错误
              }
            });
          });
        });
      }
    });
    return true; // 异步响应
  } else if (request.action === 'testTranslation') {
    // 测试翻译功能
    testTranslationAPI(request.engine, request.apiKey, request.targetLanguage)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // 异步响应
  }
});

// 显示通知
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// 测试翻译API
async function testTranslationAPI(engine, apiKey, targetLanguage) {
  const testText = 'Hello, world!';
  
  try {
    let translatedText;
    
    if (engine === 'google') {
      translatedText = await testGoogleTranslation(testText, apiKey, targetLanguage);
    } else if (engine === 'deepl') {
      translatedText = await testDeepLTranslation(testText, apiKey, targetLanguage);
    } else {
      throw new Error(chrome.i18n.getMessage('unsupportedEngine') || 'Unsupported translation engine');
    }
    
    return {
      success: true,
      originalText: testText,
      translatedText: translatedText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 测试Google翻译
async function testGoogleTranslation(text, apiKey, targetLanguage) {
  if (apiKey && apiKey.trim()) {
    // 使用官方API
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
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
    throw new Error('请提供有效的Google翻译API密钥');
  }
}

// 测试DeepL翻译
async function testDeepLTranslation(text, apiKey, targetLanguage) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('请提供有效的DeepL API密钥');
  }
  
  const url = 'https://api-free.deepl.com/v2/translate';
  
  try {
    const formData = new URLSearchParams();
    formData.append('auth_key', apiKey);
    formData.append('text', text);
    formData.append('target_lang', targetLanguage.toUpperCase());
    
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

// 监听存储变化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    console.log(chrome.i18n.getMessage('settingsUpdated') || 'Settings updated:', changes);
  }
});