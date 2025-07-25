# 表单翻译器故障排除指南

如果您遇到"翻译失败"的错误，请按照以下步骤进行排查：

## 常见问题及解决方案

### 1. 网络连接问题
**错误信息**: "网络连接失败，请检查网络连接"

**解决方案**:
- 检查您的网络连接是否正常
- 确认防火墙或代理设置没有阻止插件访问翻译API
- 尝试刷新页面后重新翻译

### 2. API密钥问题
**错误信息**: "API密钥无效或已过期" 或 "请在设置中配置API密钥"

**解决方案**:
- 点击插件的"设置"按钮
- 确认已正确输入有效的API密钥
- 对于Google翻译：
  - 访问 [Google Cloud Console](https://console.cloud.google.com/)
  - 启用 Translation API
  - 创建API密钥并确保有足够的配额
- 对于DeepL翻译：
  - 访问 [DeepL API](https://www.deepl.com/pro-api)
  - 注册账户并获取API密钥
  - 确认账户有足够的翻译配额

### 3. API调用频率限制
**错误信息**: "API调用频率过高，请稍后重试"

**解决方案**:
- 等待几分钟后重试
- 检查您的API使用配额
- 考虑升级您的API计划

### 4. 目标语言设置问题
**错误信息**: "请求参数错误，请检查目标语言设置"

**解决方案**:
- 在设置中检查目标语言是否正确选择
- 确认所选翻译引擎支持您选择的目标语言
- DeepL支持的语言较少，可能需要切换到Google翻译

### 5. 表单元素检测问题
**错误信息**: "未检测到表单元素"

**解决方案**:
- 确认页面上确实有可翻译的表单元素（文本输入框、文本域等）
- 某些动态加载的表单可能需要等待页面完全加载
- 刷新页面后重试

## 推荐设置

### 对于个人用户
- **翻译引擎**: Google翻译（免费配额较高）
- **目标语言**: 根据需要选择
- **API密钥**: 建议配置以获得更稳定的服务

### 对于企业用户
- **翻译引擎**: DeepL（翻译质量更高）
- **API密钥**: 必须配置付费API密钥
- **目标语言**: 确认DeepL支持所需语言

## 获取技术支持

如果以上解决方案都无法解决您的问题，请：

1. 打开浏览器开发者工具（F12）
2. 查看控制台（Console）中的错误信息
3. 记录具体的错误信息和操作步骤
4. 联系技术支持并提供详细信息

## API密钥获取指南

### Google翻译API
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Cloud Translation API"
4. 创建凭据 > API密钥
5. 复制API密钥到插件设置中

### DeepL API
1. 访问 [DeepL API](https://www.deepl.com/pro-api)
2. 注册DeepL Pro账户
3. 在账户设置中找到API密钥
4. 复制API密钥到插件设置中

---

**注意**: 请妥善保管您的API密钥，不要与他人分享。