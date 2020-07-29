#!/usr/bin/env node

const program = require('commander');
const fse = require('fs-extra');
const klawSync = require('klaw-sync');
const path = require('path');
const fm = require('front-matter');

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
    const outFilePath = `${target}/${outTitle}.md`;
    fse.ensureFileSync(outFilePath);
    fse.writeFileSync(outFilePath, outBody);
  } catch (error) {
    console.error(error);
  }
}

// 初始化
init();

const originPath = path.join(process.cwd(), program.origin);
const targetPath = path.join(process.cwd(), program.target);
console.log('originPath', originPath);
console.log('targetPath', targetPath);

const readFiles = klawSync(originPath, {
  nodir: true,
  filter: ({ path }) => {
    // 过滤目标路径
    if (new RegExp(targetPath).test(path)) {
      return;
    }
    const reg = /.+(\.md|\.MD|\.mD|\.Md)$/;
    return reg.test(path);
  }
});

readFiles.forEach(({ path }) => {
  convert(path, targetPath);
});




