#!/usr/bin/env node

const program = require('commander');
const fse = require('fs-extra');
const klawSync = require('klaw-sync');
const path = require('path');
const fm = require('front-matter');

const catalogue = {};
const uncategorized = [];

/**
 * 初始化接收命令参数
 */
function init() {
  // 初始接受参数
  program.option('-o, --origin <path>', '转化的原路径', './');
  program.option('-t, --target <path>', '转化的目标路径', './md2a_output');
  program.parse(process.argv);
}

/**
 * 
 * @param {string} filePath 文件路径
 * @param {string} target 目标文件夹路径
 */
function convert(filePath, target) {
  try {
    mdstr = fse.readFileSync(filePath).toString();
    const { body, attributes, frontmatter } = fm(mdstr);
    let outTitle = path.basename(filePath, path.extname(filePath));
    let outBody = body;
    if (frontmatter) {
      outTitle = attributes.title;
      outBody = `## ${attributes.title} \n` + body;
    }

    addTitleToCategory(attributes);
    const outFilePath = `${target}/${outTitle}.md`;
    fse.ensureFileSync(outFilePath);
    fse.writeFileSync(outFilePath, outBody);
  } catch (error) {
    console.error(error);
  }
}

function addTitleToCategory({ title = '', categories = [] }) {
  // 未分类
  if (categories.length === 0 && title) {
    uncategorized.push(title);
    return;
  }

  categories.forEach(category => {
    if (!catalogue[category]) {
      catalogue[category] = [title]
      return
    }
    catalogue[category].push(title);
  });
}

/**
 * 创建目录索引
 * @param {string} targetPath 目标路径
 */
function createReadMeFile(targetPath) {
  const readmePath = `${targetPath}/README.md`;
  fse.ensureFileSync(readmePath);
  const header = `## 博客地址：[www.lumin.tech](http://www.lumin.tech)\n`;
  let readmeContent = '### 目录\n';

  let cats = ''; // 分类锚点
  let allTitle = '';
  const keys = Object.keys(catalogue);
  if (uncategorized.length > 0) {
    catalogue['未分类'] = uncategorized;
    keys.push('未分类');
  }
  keys.forEach((ca, i) => {
    if (i === keys.length - 1) {
      cats += `[${ca}](#${ca})\n`;
    } else {
      cats += `[${ca}](#${ca}) | `;
    }

    let titles = '';

    catalogue[ca].forEach(title => {
      titles += `* #### [${title}](./${encodeURIComponent(title)}.md)\n`;
    });
    // 添加锚点目标分类 和 文章标题
    allTitle += `### ${ca}\n` + titles;
  });

  readmeContent += cats + allTitle;
  fse.writeFileSync(readmePath, header + readmeContent);
}

// -----------------------------------------------------------
// 初始化
init();

const originPath = path.join(process.cwd(), program.origin);
const targetPath = path.join(process.cwd(), program.target);

// 遍历文件
const readFiles = klawSync(originPath, {
  nodir: true,
  traverseAll: true,
  filter: ({ path }) => {
    if (new RegExp(targetPath).test(path)) {
      return;
    }
    const reg = /.+(\.md|\.MD|\.mD|\.Md)$/;
    return reg.test(path);
  }
});

// 转换文件
readFiles.forEach(({ path }) => {
  convert(path, targetPath);
});

createReadMeFile(targetPath);






