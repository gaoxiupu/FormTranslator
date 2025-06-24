// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // 首次安装时设置默认配置
    chrome.storage.sync.set({
      engine: 'google',
      targetLanguage: 'zh-CN',
      googleApiKey: '',
      deeplApiKey: '',

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
      throw new Error('不支持的翻译引擎');
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
  if (apiKey) {
    // 使用官方API
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
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
      const errorData = await response.json();
      throw new Error(`Google翻译API错误: ${errorData.error?.message || response.status}`);
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
  } else {
    // 使用免费版本
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google翻译错误: ${response.status}`);
    }
    
    const data = await response.json();
    let translatedText = '';
    for (const sentence of data[0]) {
      if (sentence[0]) {
        translatedText += sentence[0];
      }
    }
    
    return translatedText;
  }
}

// 测试DeepL翻译
async function testDeepLTranslation(text, apiKey, targetLanguage) {
  if (!apiKey) {
    throw new Error('DeepL翻译需要API密钥');
  }
  
  const url = 'https://api-free.deepl.com/v2/translate';
  
  const formData = new URLSearchParams();
  formData.append('auth_key', apiKey);
  formData.append('text', text);
  formData.append('target_lang', targetLanguage);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DeepL翻译API错误: ${errorData.message || response.status}`);
  }
  
  const data = await response.json();
  return data.translations[0].text;
}

// 监听存储变化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    console.log('设置已更新:', changes);
  }
});