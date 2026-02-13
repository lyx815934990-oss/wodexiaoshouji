@echo off
chcp 65001 >nul
echo 正在复制宠物图片文件...

if not exist "public\pet-images" mkdir "public\pet-images"

copy "桌宠素材\桌宠猫咪（幼崽）.png" "public\pet-images\cat-stage1.png" >nul
copy "桌宠素材\桌宠猫咪（青年）.png" "public\pet-images\cat-stage2.png" >nul
copy "桌宠素材\桌宠猫咪（成年）.png" "public\pet-images\cat-stage3.png" >nul

if exist "public\pet-images\cat-stage1.png" (
    echo 图片复制成功！
    echo 现在可以在宠物应用中看到你的猫咪图片了。
) else (
    echo 复制失败，请手动复制文件。
    echo 源目录：桌宠素材\
    echo 目标目录：public\pet-images\
)

pause

