# 主备切换 SOP

## 部署节点

| 节点 | 角色 | URL | AI 模式 |
|------|------|-----|---------|
| 腾讯云 | 主链接 | https://her-start.yourdomain.com | ai（真实 DeepSeek） |
| CodeBanana | 备用链接 | https://her-start.codebanana.app | demo（演示模式） |

## 主链接失效时的切换步骤

1. **检查主链接**
   ```
   curl -s -o /dev/null -w "%{http_code}" https://her-start.yourdomain.com/
   ```

2. **确认故障**
   - 非 200 响应
   - 超时
   - 502/503/504

3. **将备用链接发给评委**
   ```
   https://her-start.codebanana.app
   ```

4. **提醒备用网址需要重新填写**
   - 备用节点为 demo 模式
   - 结果不会根据回答个性化
   - localStorage 不跨域同步
   - 需要重新完成四问

5. **检查备用节点状态**
   ```
   curl https://her-start.codebanana.app/
   ```

6. **记录切换时间**
   - 记录故障发生时间
   - 记录切换时间
   - 记录恢复时间

## 恢复主链接后的回切

1. 确认腾讯云服务恢复
2. 验证 mode=ai
3. 通知评委恢复使用主链接
