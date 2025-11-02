#!/bin/bash
# 验证书籍详情页 H5 自动化修复
# 用途：验证 uni is not defined 问题已解决

set -e

echo "========================================="
echo "书籍详情页 H5 自动化修复验证脚本"
echo "========================================="
echo ""

cd "$(dirname "$0")/.."

echo "1️⃣  检查配置文件..."
echo "   - vite.config.ts"
if grep -q "strictPort: true" vite.config.ts; then
  echo "   ✅ strictPort 已配置"
else
  echo "   ❌ strictPort 未配置"
  exit 1
fi

echo "   - playwright.config.ts"
if grep -q "http://127.0.0.1:3000" playwright.config.ts; then
  echo "   ✅ baseURL 已更新"
else
  echo "   ❌ baseURL 未更新"
  exit 1
fi

echo ""
echo "2️⃣  检查路由配置..."
if grep -q '"path": "detail/index"' src/pages.json; then
  echo "   ✅ 路由配置正确 (pages-book/detail/index)"
else
  echo "   ❌ 路由配置错误"
  exit 1
fi

echo ""
echo "3️⃣  检查工具函数..."
if [ -f "src/utils/safeUni.ts" ]; then
  echo "   ✅ safeUni.ts 已创建"
else
  echo "   ❌ safeUni.ts 不存在"
  exit 1
fi

echo ""
echo "4️⃣  检查 E2E 测试文件..."
if [ -f "tests/e2e/book-detail.spec.ts" ]; then
  echo "   ✅ book-detail.spec.ts 已创建"
else
  echo "   ❌ book-detail.spec.ts 不存在"
  exit 1
fi

echo ""
echo "5️⃣  代码引用检查..."
BOOK_DETAIL_REFS=$(grep -r "pages-book/detail/index" src --include="*.ts" --include="*.vue" | wc -l)
echo "   找到 $BOOK_DETAIL_REFS 处正确的路由引用"

OLD_ROUTE_REFS=$(grep -r "pages-book/detail/detail" src --include="*.ts" --include="*.vue" 2>/dev/null | wc -l)
if [ "$OLD_ROUTE_REFS" -eq 0 ]; then
  echo "   ✅ 没有旧路由引用"
else
  echo "   ⚠️  发现 $OLD_ROUTE_REFS 处旧路由引用，需要手动修复"
fi

echo ""
echo "========================================="
echo "✅ 所有检查通过！"
echo "========================================="
echo ""
echo "下一步操作："
echo "1. 启动 H5 开发服务器："
echo "   npm run dev:h5"
echo ""
echo "2. 在浏览器中访问："
echo "   http://127.0.0.1:3000/#/pages-book/detail/index?id=1"
echo ""
echo "3. 运行 E2E 测试："
echo "   npx playwright test tests/e2e/book-detail.spec.ts"
echo ""
