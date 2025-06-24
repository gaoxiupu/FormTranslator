document.addEventListener('DOMContentLoaded', function() {
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
        formCountElement.textContent = '无法访问此页面';
        return;
      }
      
      const count = results[0].result;
      formCountElement.textContent = `检测到 ${count} 个表单元素`;
      
      if (count === 0) {
        translateBtn.disabled = true;
        translateBtn.textContent = '⚠️ 未检测到表单元素';
        translateBtn.style.opacity = '0.6';
      }
    });
  });
  
  // 翻译按钮点击事件
  translateBtn.addEventListener('click', function() {
    statusElement.textContent = '正在翻译...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'translateForm'}, function(response) {
        if (chrome.runtime.lastError || !response) {
          statusElement.textContent = '翻译失败，请重试';
          return;
        }
        
        if (response.success) {
          statusElement.textContent = `已翻译 ${response.count} 个表单元素`;
        } else {
          statusElement.textContent = response.message || '翻译失败，请重试';
        }
      });
    });
  });
  
  // 设置链接点击事件
  settingsLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});

// 计算页面中的表单元素数量
function countFormElements() {
  const formElements = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], select');
  return formElements.length;
}