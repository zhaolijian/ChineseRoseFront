#!/bin/bash

echo "===================="
echo "H5登录页面自动化测试"
echo "===================="
echo ""

# 检查H5服务器是否运行
echo "检查H5开发服务器状态..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✓ H5开发服务器正在运行"
else
    echo "× H5开发服务器未运行，请先运行: npm run dev:h5"
    exit 1
fi

echo ""
echo "开始执行自动化测试..."
echo ""

# 运行Playwright测试
npx playwright test tests/h5/login.test.ts --project=chromium --reporter=list

# 生成测试报告
echo ""
echo "生成测试报告..."
npx playwright show-report

echo ""
echo "测试完成！"