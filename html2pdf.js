#!/usr/bin/env node
/**
 * HTML 转 PDF 工具
 * 使用 Puppeteer 将 HTML 文件转换为 PDF
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 将 HTML 文件转换为 PDF
 * @param {string} htmlPath - HTML 文件路径
 * @param {string} pdfPath - PDF 输出路径（可选）
 * @param {Object} options - PDF 配置选项
 */
async function htmlToPdf(htmlPath, pdfPath = null, options = {}) {
  // 检查 HTML 文件是否存在
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ 错误: 找不到文件 ${htmlPath}`);
    return false;
  }

  // 如果没有指定输出路径，使用同名的 PDF 文件
  if (!pdfPath) {
    const parsedPath = path.parse(htmlPath);
    pdfPath = path.join(parsedPath.dir, `${parsedPath.name}.pdf`);
  }

  // 获取 HTML 文件的绝对路径
  const absoluteHtmlPath = path.resolve(htmlPath);
  const fileUrl = `file://${absoluteHtmlPath}`;

  console.log(`📄 正在转换: ${htmlPath}`);
  console.log(`📥 输出到: ${pdfPath}`);

  let browser;
  try {
    // 查找系统 Chrome 路径
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',    // Windows
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',                                        // Linux
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    ];

    let executablePath;
    const fs = require('fs');
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        executablePath = chromePath;
        break;
      }
    }

    // 启动浏览器
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath, // 使用系统 Chrome
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 加载 HTML 文件
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0'
    });

    // 默认 PDF 配置
    const pdfOptions = {
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      ...options
    };

    // 生成 PDF
    await page.pdf(pdfOptions);

    console.log(`✅ 转换成功！PDF 已保存到: ${pdfPath}`);
    return true;

  } catch (error) {
    console.error(`❌ 转换失败:`, error.message);
    return false;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 批量转换 HTML 文件到 PDF
 * @param {string[]} htmlFiles - HTML 文件路径数组
 */
async function batchConvert(htmlFiles) {
  console.log(`🚀 开始批量转换 ${htmlFiles.length} 个文件...\n`);
  
  let successCount = 0;
  let failCount = 0;

  for (const htmlFile of htmlFiles) {
    const result = await htmlToPdf(htmlFile);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // 空行分隔
  }

  console.log(`\n📊 转换完成！成功: ${successCount}, 失败: ${failCount}`);
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('用法:');
    console.log('  node html2pdf.js <HTML文件路径> [PDF输出路径]');
    console.log('  node html2pdf.js <HTML文件1> <HTML文件2> ... (批量转换)');
    console.log('\n示例:');
    console.log('  node html2pdf.js 蔡忠岭2026.html');
    console.log('  node html2pdf.js 蔡忠岭2026.html output.pdf');
    console.log('  node html2pdf.js file1.html file2.html file3.html');
    process.exit(1);
  }

  // 判断是单个文件还是批量转换
  if (args.length === 1 || (args.length === 2 && !args[1].endsWith('.html'))) {
    // 单个文件转换
    const htmlPath = args[0];
    const pdfPath = args[1] || null;
    
    htmlToPdf(htmlPath, pdfPath).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // 批量转换
    batchConvert(args).then(() => {
      process.exit(0);
    });
  }
}

// 导出函数供其他模块使用
module.exports = { htmlToPdf, batchConvert };
