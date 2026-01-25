# HTML 转 PDF 工具

简单易用的 HTML 转 PDF 转换工具，基于 Node.js 和 Puppeteer。

## 功能特点

- ✅ 简单易用，一行命令完成转换
- ✅ 完美支持中文字符
- ✅ 保留原 HTML 的样式和排版
- ✅ 支持 A4 纸张大小
- ✅ 自动优化页边距
- ✅ 支持批量转换多个文件
- ✅ 基于 Chrome 浏览器引擎，渲染效果最佳

## 安装

### 1. 安装 Node.js 依赖

使用 pnpm（推荐）:
```bash
pnpm install
```

或使用 npm:
```bash
npm install
```

**注意**: 本工具已配置为使用系统已安装的 Chrome 浏览器，无需额外下载。支持 macOS、Windows 和 Linux 系统。

## 使用方法

### 基本用法

```bash
node html2pdf.js <HTML文件路径>
```

这将创建一个同名的 PDF 文件。

### 指定输出文件名

```bash
node html2pdf.js <HTML文件路径> <PDF输出路径>
```

### 批量转换

```bash
node html2pdf.js <HTML文件1> <HTML文件2> <HTML文件3> ...
```

### 示例

**使用 Node 命令:**
```bash
# 转换简历文件（自动生成 蔡忠岭2026.pdf）
node html2pdf.js 蔡忠岭2026.html

# 指定输出文件名
node html2pdf.js 蔡忠岭2026.html resume_2026.pdf

# 批量转换多个文件
node html2pdf.js file1.html file2.html file3.html
```

**使用 pnpm/npm 脚本:**
```bash
# 快速转换简历
pnpm convert:resume

# 转换任意文件
pnpm convert 你的文件.html

# 测试转换
pnpm test
```

**使用快捷脚本 (macOS/Linux):**
```bash
# 转换文件
./convert.sh 蔡忠岭2026.html

# 指定输出
./convert.sh input.html output.pdf
```

## 高级用法

### 作为模块使用

可以在其他 Node.js 项目中引入并使用：

```javascript
const { htmlToPdf } = require('./html2pdf');

// 基本用法
await htmlToPdf('input.html');

// 指定输出路径
await htmlToPdf('input.html', 'output.pdf');

// 自定义选项
await htmlToPdf('input.html', 'output.pdf', {
  format: 'A4',
  landscape: false,
  margin: {
    top: '10mm',
    right: '10mm',
    bottom: '10mm',
    left: '10mm'
  }
});
```

## 自定义配置

可以在 `html2pdf.js` 中修改 `pdfOptions` 来自定义 PDF 生成选项：

- `format`: 纸张大小（A4, Letter, A3 等）
- `landscape`: 是否横向（true/false）
- `margin`: 页边距
- `printBackground`: 是否打印背景色（true/false）
- `scale`: 缩放比例（0.1 - 2）

## 快速开始

安装完依赖后，立即转换您的简历：

```bash
# 使用 pnpm（推荐）
pnpm convert:resume

# 或使用 node
node html2pdf.js 蔡忠岭2026.html
```

生成的 PDF 文件将保存在同目录下。

## 常见问题

### 1. 安装失败

**npm 缓存权限问题:**
```bash
# 使用 pnpm 代替（推荐）
pnpm install

# 或清理 npm 缓存
npm cache clean --force
```

**网络问题:**
```bash
# 使用国内镜像
pnpm install --registry=https://registry.npmmirror.com
```

### 2. Chrome 浏览器未找到

本工具会自动查找系统已安装的 Chrome 浏览器。如果提示找不到 Chrome：

**macOS:**
- 确保已安装 Google Chrome（在 `/Applications` 目录）

**Windows:**
- 安装 Google Chrome 到默认位置

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install google-chrome-stable

# 或使用 Chromium
sudo apt-get install chromium-browser
```

### 3. 中文显示问题

Puppeteer 基于 Chrome，会自动使用系统字体，通常不会有中文显示问题。如果遇到中文显示异常，确保系统已安装中文字体。

### 4. Linux 无头服务器

在 Linux 服务器上运行可能需要安装额外的依赖：

```bash
# Debian/Ubuntu
sudo apt-get install -y libgbm-dev libxss1 libasound2

# CentOS/RHEL
sudo yum install -y mesa-libgbm libXScrnSaver alsa-lib
```

### 5. 权限问题

如果遇到权限错误：
```bash
# macOS/Linux
chmod +x convert.sh
chmod +x html2pdf.js
```

## 技术栈

- Node.js 20+
- Puppeteer 22.0.0
- Chrome Headless

## 文件结构

```
.
├── package.json          # 项目配置和依赖
├── html2pdf.js          # 主程序
├── README.md            # 使用说明
└── 蔡忠岭2026.html      # 示例 HTML 文件
```

## 许可证

MIT
