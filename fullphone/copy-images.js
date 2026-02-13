const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '桌宠素材');
const destDir = path.join(__dirname, 'src', 'assets', 'pet-images');

// 创建目标目录
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制文件
const files = [
  { source: '桌宠猫咪（幼崽）.png', dest: 'cat-stage1.png' },
  { source: '桌宠猫咪（青年）.png', dest: 'cat-stage2.png' },
  { source: '桌宠猫咪（成年）.png', dest: 'cat-stage3.png' }
];

files.forEach(({ source, dest }) => {
  const sourcePath = path.join(sourceDir, source);
  const destPath = path.join(destDir, dest);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ 已复制: ${source} -> ${dest}`);
  } else {
    console.log(`✗ 文件不存在: ${sourcePath}`);
  }
});

console.log('\n图片复制完成！');

