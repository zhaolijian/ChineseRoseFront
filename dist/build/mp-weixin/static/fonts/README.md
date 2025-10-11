# TabBar IconFont 字体文件

## 使用的图标Unicode编码：

- 书架 (bookshelf): `\ue653`
- 笔记 (note): `\ue60a` 
- 导图 (mindmap): `\ue631`
- 我的 (profile): `\ue6d0`

## 获取字体文件的步骤：

### 方案1：使用阿里巴巴iconfont平台（推荐）

1. 访问 https://www.iconfont.cn/
2. 搜索并选择以下图标：
   - 书架/书本类图标
   - 笔记/记录类图标  
   - 思维导图/网络图标
   - 用户/个人中心图标

3. 将图标添加到项目，记录Unicode编码
4. 下载字体文件包，获取 `iconfont.ttf`
5. 将 `iconfont.ttf` 放置到此目录

### 方案2：使用uView Plus内置图标

uView Plus已经包含了丰富的图标，可以直接使用：

```json
{
  "iconfont": {
    "text": "\ue653",  // 对应u-icon name="home"
    "selectedText": "\ue653",
    "fontSize": "22px", 
    "color": "#7A7E83",
    "selectedColor": "#4A90E2"
  }
}
```

## 当前配置

pages.json中已配置的Unicode编码对应常见的图标字体，如果使用标准iconfont项目，这些编码通常可以直接使用。

## 临时解决方案

在获取到正确的字体文件之前，可以先注释掉 `iconfontSrc` 配置，使用 emoji 或 uView Plus 图标作为临时方案。