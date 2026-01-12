#!/bin/bash
# iOS PWA 功能部署前檢查腳本

echo "🔍 iOS PWA 功能部署前檢查..."
echo ""

# 檢查必要檔案
echo "📁 檢查關鍵檔案..."
files=(
  "index.html"
  "manifest.json"
  "src/index.css"
  "src/App.css"
  "src/App.jsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺少)"
  fi
done

echo ""
echo "🔍 檢查 index.html 必要標籤..."
if grep -q "apple-mobile-web-app-capable" index.html; then
  echo "  ✅ apple-mobile-web-app-capable"
else
  echo "  ❌ 缺少 apple-mobile-web-app-capable"
fi

if grep -q "apple-mobile-web-app-status-bar-style" index.html; then
  echo "  ✅ apple-mobile-web-app-status-bar-style"
else
  echo "  ❌ 缺少 apple-mobile-web-app-status-bar-style"
fi

if grep -q "viewport-fit=cover" index.html; then
  echo "  ✅ viewport-fit=cover"
else
  echo "  ❌ 缺少 viewport-fit=cover"
fi

echo ""
echo "🔍 檢查 CSS 安全區域支援..."
if grep -q "safe-area-inset" src/index.css; then
  echo "  ✅ safe-area-inset 已設定"
else
  echo "  ❌ 缺少 safe-area-inset"
fi

echo ""
echo "🔍 檢查 App.jsx 新功能..."
if grep -q "showIOSInstallPrompt" src/App.jsx; then
  echo "  ✅ iOS 安裝提示功能已添加"
else
  echo "  ❌ 缺少 iOS 安裝提示"
fi

if grep -q "showOrientationWarning" src/App.jsx; then
  echo "  ✅ 螢幕方向警告功能已添加"
else
  echo "  ❌ 缺少螢幕方向警告"
fi

echo ""
echo "✨ 檢查完成！"
echo ""
echo "📱 下一步："
echo "  1. npm run build"
echo "  2. npm run deploy"
echo "  3. 使用 iOS Safari 測試"
echo ""
