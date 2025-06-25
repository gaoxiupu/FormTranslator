document.addEventListener('DOMContentLoaded', function() {
  // Initialize i18n
  initializeI18n();
  
  const translateBtn = document.getElementById('translateBtn');
  const statusElement = document.getElementById('status');
  const formCountElement = document.getElementById('formCount');
  const settingsLink = document.getElementById('settingsLink');
  
  // 获取当前标签页信息
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // 检查当前页面中的表单元素数量
    chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      function: countFormElements
    }, (results) => {
      if (chrome.runtime.lastError) {
        formCountElement.textContent = chrome.i18n.getMessage('cannotAccessPage');
        return;
      }
      
      const count = results[0].result;
      formCountElement.textContent = chrome.i18n.getMessage('formElementsDetected', [count.toString()]);
      
      if (count === 0) {
        translateBtn.disabled = true;
        translateBtn.textContent = chrome.i18n.getMessage('noFormElements');
        translateBtn.style.opacity = '0.6';
      }
    });
  });
  
  // 翻译按钮点击事件
  translateBtn.addEventListener('click', function() {
    // 禁用按钮防止重复点击
    translateBtn.disabled = true;
    translateBtn.textContent = chrome.i18n.getMessage('translating');
    statusElement.textContent = chrome.i18n.getMessage('translating');
    statusElement.style.color = '#007bff';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'translateForm'}, function(response) {
        // 重新启用按钮
        translateBtn.disabled = false;
        translateBtn.textContent = chrome.i18n.getMessage('translateButton');
        
        if (chrome.runtime.lastError || !response) {
          statusElement.textContent = '无法连接到页面，请刷新页面后重试';
          statusElement.style.color = '#dc3545';
          return;
        }
        
        if (response.success) {
          statusElement.textContent = chrome.i18n.getMessage('translationComplete', [response.count.toString()]);
          statusElement.style.color = '#28a745';
          if (response.failed && response.failed > 0) {
            statusElement.textContent += ` (${response.failed}个失败)`;
            statusElement.style.color = '#ffc107';
          }
        } else {
          statusElement.textContent = response.message || chrome.i18n.getMessage('translationFailed');
          statusElement.style.color = '#dc3545';
          
          // 如果是API密钥相关错误，提供设置链接提示
          if (response.message && (response.message.includes('API密钥') || response.message.includes('配置'))) {
            const settingsHint = document.createElement('div');
            settingsHint.style.fontSize = '12px';
            settingsHint.style.marginTop = '5px';
            settingsHint.style.color = '#6c757d';
            settingsHint.textContent = '点击下方"设置"按钮配置API密钥';
            statusElement.appendChild(settingsHint);
          }
        }
      });
    });
  });
  
  // 设置链接点击事件
  settingsLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});

// Initialize internationalization
function initializeI18n() {
  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = message;
      } else {
        element.textContent = message;
      }
    }
  });
}

// 计算页面中的表单元素数量
function countFormElements() {
  const formElements = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], select');
  return formElements.length;
}