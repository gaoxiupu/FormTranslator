// 支持的语言列表
const supportedLanguages = {
  'zh-CN': '中文 (简体)',
  'zh-TW': '中文 (繁体)',
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'fr': '法语',
  'de': '德语',
  'es': '西班牙语',
  'it': '意大利语',
  'pt': '葡萄牙语',
  'ru': '俄语',
  'ar': '阿拉伯语',
  'th': '泰语',
  'vi': '越南语',
  'hi': '印地语',
  'tr': '土耳其语',
  'pl': '波兰语',
  'nl': '荷兰语',
  'sv': '瑞典语',
  'da': '丹麦语',
  'no': '挪威语',
  'fi': '芬兰语',
  'cs': '捷克语',
  'hu': '匈牙利语',
  'ro': '罗马尼亚语',
  'bg': '保加利亚语',
  'hr': '克罗地亚语',
  'sk': '斯洛伐克语',
  'sl': '斯洛文尼亚语',
  'et': '爱沙尼亚语',
  'lv': '拉脱维亚语',
  'lt': '立陶宛语',
  'uk': '乌克兰语',
  'he': '希伯来语',
  'fa': '波斯语',
  'ur': '乌尔都语',
  'bn': '孟加拉语',
  'ta': '泰米尔语',
  'te': '泰卢固语',
  'ml': '马拉雅拉姆语',
  'kn': '卡纳达语',
  'gu': '古吉拉特语',
  'pa': '旁遮普语',
  'mr': '马拉地语',
  'ne': '尼泊尔语',
  'si': '僧伽罗语',
  'my': '缅甸语',
  'km': '高棉语',
  'lo': '老挝语',
  'ka': '格鲁吉亚语',
  'am': '阿姆哈拉语',
  'sw': '斯瓦希里语',
  'zu': '祖鲁语',
  'af': '南非荷兰语',
  'sq': '阿尔巴尼亚语',
  'az': '阿塞拜疆语',
  'be': '白俄罗斯语',
  'bs': '波斯尼亚语',
  'eu': '巴斯克语',
  'gl': '加利西亚语',
  'is': '冰岛语',
  'ga': '爱尔兰语',
  'mk': '马其顿语',
  'mt': '马耳他语',
  'cy': '威尔士语'
};

// DOM元素
const engineSelect = document.getElementById('engine');
const googleApiKeyInput = document.getElementById('googleApiKey');
const deeplApiKeyInput = document.getElementById('deeplApiKey');

const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusDiv = document.getElementById('status');
const languageSearch = document.getElementById('languageSearch');
const languageDropdown = document.getElementById('languageDropdown');
const targetLanguageInput = document.getElementById('targetLanguage');
const clearLanguageSearchButton = document.getElementById('clearLanguageSearch');
const googleApiSection = document.getElementById('googleApiSection');
const deeplApiSection = document.getElementById('deeplApiSection');
const toggleGoogleKeyButton = document.getElementById('toggleGoogleKey');
const toggleDeeplKeyButton = document.getElementById('toggleDeeplKey');
const testGoogleApiButton = document.getElementById('testGoogleApi');
const testDeeplApiButton = document.getElementById('testDeeplApi');
const googleTestResult = document.getElementById('googleTestResult');
const deeplTestResult = document.getElementById('deeplTestResult');

// 当前选中的目标语言
let selectedTargetLanguage = 'zh';

// Initialize internationalization
function initializeI18n() {
  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      if (element.tagName === 'OPTION') {
        element.textContent = message;
      } else if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = message;
      } else {
        element.textContent = message;
      }
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.placeholder = message;
    }
  });
  
  // Update document title
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const messageKey = titleElement.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      document.title = message;
    }
  }
}



// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initializeI18n();
  initializeLanguageSelector();
  loadSettings();
  bindEvents();
});

// 初始化语言选择器
function initializeLanguageSelector() {
  // 设置初始显示值
  updateLanguageDisplay();
  
  // 渲染所有语言选项
  renderLanguageOptions(Object.entries(supportedLanguages));
}

// 渲染语言选项
function renderLanguageOptions(languages) {
  languageDropdown.innerHTML = '';
  
  if (languages.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = '未找到匹配的语言';
    languageDropdown.appendChild(noResults);
    return;
  }
  
  languages.forEach(([code, name]) => {
    const option = document.createElement('div');
    option.className = 'language-option';
    option.textContent = name;
    option.dataset.code = code;
    
    if (code === selectedTargetLanguage) {
      option.classList.add('selected');
    }
    
    option.addEventListener('click', function() {
      selectLanguage(code, name);
    });
    
    languageDropdown.appendChild(option);
  });
}

// 选择语言
function selectLanguage(code, name) {
  selectedTargetLanguage = code;
  targetLanguageInput.value = code;
  languageSearch.value = name;
  clearLanguageSearchButton.style.display = 'none';
  hideDropdown();
  updateLanguageSelection();
}

// 更新语言显示
function updateLanguageDisplay() {
  const languageName = supportedLanguages[selectedTargetLanguage] || '中文 (简体)';
  languageSearch.value = languageName;
  targetLanguageInput.value = selectedTargetLanguage;
  // 隐藏清空按钮，因为显示的是选中的语言名称
  clearLanguageSearchButton.style.display = 'none';
}

// 清空语言搜索
function clearLanguageSearch() {
  languageSearch.value = '';
  clearLanguageSearchButton.style.display = 'none';
  currentHighlightIndex = -1;
  renderLanguageOptions(Object.entries(supportedLanguages));
  showDropdown();
  languageSearch.focus();
}

// 更新语言选择状态
function updateLanguageSelection() {
  document.querySelectorAll('.language-option').forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.code === selectedTargetLanguage) {
      option.classList.add('selected');
    }
  });
}

// 显示下拉框
function showDropdown() {
  languageDropdown.classList.add('show');
}

// 隐藏下拉框
function hideDropdown() {
  languageDropdown.classList.remove('show');
  clearHighlight();
}

// 清除高亮
function clearHighlight() {
  document.querySelectorAll('.language-option').forEach(option => {
    option.classList.remove('highlighted');
  });
}

// 搜索语言
function searchLanguages(query) {
  const filteredLanguages = Object.entries(supportedLanguages).filter(([code, name]) => {
    return name.toLowerCase().includes(query.toLowerCase()) || 
           code.toLowerCase().includes(query.toLowerCase());
  });
  
  renderLanguageOptions(filteredLanguages);
  showDropdown();
}

// 键盘导航
let currentHighlightIndex = -1;

function handleKeyboardNavigation(event) {
  const options = languageDropdown.querySelectorAll('.language-option');
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      currentHighlightIndex = Math.min(currentHighlightIndex + 1, options.length - 1);
      updateHighlight(options);
      break;
    case 'ArrowUp':
      event.preventDefault();
      currentHighlightIndex = Math.max(currentHighlightIndex - 1, -1);
      updateHighlight(options);
      break;
    case 'Enter':
      event.preventDefault();
      if (currentHighlightIndex >= 0 && options[currentHighlightIndex]) {
        const option = options[currentHighlightIndex];
        const code = option.dataset.code;
        const name = option.textContent;
        selectLanguage(code, name);
      }
      break;
    case 'Escape':
      hideDropdown();
      languageSearch.blur();
      break;
  }
}

function updateHighlight(options) {
  clearHighlight();
  if (currentHighlightIndex >= 0 && options[currentHighlightIndex]) {
    options[currentHighlightIndex].classList.add('highlighted');
    // 滚动到可见区域
    options[currentHighlightIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
}



// 绑定事件
function bindEvents() {
  // 翻译引擎切换
  engineSelect.addEventListener('change', function() {
    toggleApiSections();
  });
  

  
  // 语言搜索框事件
  languageSearch.addEventListener('input', function() {
    const query = this.value.trim();
    currentHighlightIndex = -1;
    
    // 显示或隐藏清空按钮
    if (query === '') {
      clearLanguageSearchButton.style.display = 'none';
      renderLanguageOptions(Object.entries(supportedLanguages));
      showDropdown();
    } else {
      clearLanguageSearchButton.style.display = 'flex';
      searchLanguages(query);
    }
  });
  
  // 清空搜索按钮事件
  clearLanguageSearchButton.addEventListener('click', function() {
    clearLanguageSearch();
  });
  
  languageSearch.addEventListener('focus', function() {
    currentHighlightIndex = -1;
    // 如果搜索框有内容，显示清空按钮
    if (this.value.trim() !== '' && this.value !== supportedLanguages[selectedTargetLanguage]) {
      clearLanguageSearchButton.style.display = 'flex';
    }
    renderLanguageOptions(Object.entries(supportedLanguages));
    showDropdown();
  });
  
  languageSearch.addEventListener('keydown', handleKeyboardNavigation);
  
  // 点击外部关闭下拉框
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.language-selector')) {
      hideDropdown();
    }
  });
  
  // 密钥可见性切换
  toggleGoogleKeyButton.addEventListener('click', function() {
    togglePasswordVisibility(googleApiKeyInput, toggleGoogleKeyButton);
  });
  
  toggleDeeplKeyButton.addEventListener('click', function() {
    togglePasswordVisibility(deeplApiKeyInput, toggleDeeplKeyButton);
  });
  
  // 测试API按钮
  testGoogleApiButton.addEventListener('click', function() {
    testTranslationAPI('google');
  });
  
  testDeeplApiButton.addEventListener('click', function() {
    testTranslationAPI('deepl');
  });
  
  // 保存设置
  saveButton.addEventListener('click', saveSettings);
  
  // 重置设置
  resetButton.addEventListener('click', resetSettings);
}

// 切换API设置区域显示
function toggleApiSections() {
  const selectedEngine = engineSelect.value;
  
  if (selectedEngine === 'google') {
    googleApiSection.style.display = 'block';
    deeplApiSection.style.display = 'none';
  } else if (selectedEngine === 'deepl') {
    googleApiSection.style.display = 'none';
    deeplApiSection.style.display = 'block';
  }
}

// 切换密码可见性
function togglePasswordVisibility(input, button) {
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// 加载设置
function loadSettings() {
  chrome.runtime.sendMessage({action: 'getSettings'}, function(settings) {
    if (chrome.runtime.lastError) {
      showStatus('加载设置失败', 'error');
      return;
    }
    
    // 设置翻译引擎
    if (settings.engine) {
      engineSelect.value = settings.engine;
    }
    
    // 设置目标语言
    if (settings.targetLanguage) {
      selectedTargetLanguage = settings.targetLanguage;
      updateLanguageDisplay();
      updateLanguageSelection();
    }
    
    // 设置API密钥
    if (settings.googleApiKey) {
      googleApiKeyInput.value = settings.googleApiKey;
    }
    
    if (settings.deeplApiKey) {
      deeplApiKeyInput.value = settings.deeplApiKey;
    }
    

    
    // 切换API设置区域
    toggleApiSections();
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    engine: engineSelect.value,
    targetLanguage: selectedTargetLanguage,
    googleApiKey: googleApiKeyInput.value.trim(),
    deeplApiKey: deeplApiKeyInput.value.trim(),
    
  };
  
  // 验证设置
  if (settings.engine === 'deepl' && !settings.deeplApiKey) {
    showStatus('DeepL 翻译需要 API 密钥', 'error');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'saveSettings',
    settings: settings
  }, function(response) {
    if (chrome.runtime.lastError || !response.success) {
      showStatus('保存设置失败: ' + (response?.error || chrome.runtime.lastError?.message), 'error');
    } else {
      showStatus(chrome.i18n.getMessage('settingsSaved'), 'success');
    }
  });
}

// 重置设置
function resetSettings() {
  if (confirm('确定要恢复默认设置吗？这将清除所有自定义配置。')) {
    const defaultSettings = {
      engine: 'google',
      targetLanguage: 'zh-CN',
      googleApiKey: '',
      deeplApiKey: '',
      
    };
    
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: defaultSettings
    }, function(response) {
      if (chrome.runtime.lastError || !response.success) {
        showStatus('重置设置失败', 'error');
      } else {
        showStatus(chrome.i18n.getMessage('settingsReset'), 'success');
        // 重新加载设置
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }
}

// 测试翻译API
function testTranslationAPI(engine) {
  const apiKey = engine === 'google' ? googleApiKeyInput.value.trim() : deeplApiKeyInput.value.trim();
  const resultDiv = engine === 'google' ? googleTestResult : deeplTestResult;
  const button = engine === 'google' ? testGoogleApiButton : testDeeplApiButton;
  
  // 显示加载状态
  button.disabled = true;
  button.textContent = '测试中...';
  resultDiv.className = 'test-result';
  resultDiv.style.display = 'none';
  
  chrome.runtime.sendMessage({
    action: 'testTranslation',
    engine: engine,
    apiKey: apiKey,
    targetLanguage: selectedTargetLanguage
  }, function(response) {
    // 恢复按钮状态
    button.disabled = false;
    button.textContent = engine === 'google' ? '测试 Google 翻译' : '测试 DeepL 翻译';
    
    if (chrome.runtime.lastError || !response) {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = '测试失败: ' + (chrome.runtime.lastError?.message || '未知错误');
    } else if (response.success) {
      resultDiv.className = 'test-result success';
      resultDiv.innerHTML = `
        <strong>测试成功！</strong><br>
        原文: ${response.originalText}<br>
        译文: ${response.translatedText}
      `;
    } else {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = '测试失败: ' + response.error;
    }
  });
}

// 显示状态消息
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  // 3秒后隐藏状态消息
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}