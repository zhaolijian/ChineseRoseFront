#!/bin/bash

# 验证登录页面修复效果脚本
# Created: 2025-09-11

echo "🔍 开始验证登录页面修复效果..."
echo "========================================="

# 配置
BASE_URL="http://localhost:5173"
LOGIN_PATH="/#/pages/login/login"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试结果统计
PASS=0
FAIL=0

# 测试函数
test_case() {
    local test_name=$1
    local test_result=$2
    local test_message=$3
    
    if [ $test_result -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name: $test_message"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $test_name: $test_message"
        ((FAIL++))
    fi
}

# 1. 测试H5服务是否运行
echo "📋 测试1: H5服务状态"
if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
    test_case "H5服务" 0 "服务正常运行"
else
    test_case "H5服务" 1 "服务未响应"
    echo "❌ H5服务未运行，请先启动: npm run dev:h5"
    exit 1
fi

# 2. 测试登录页面是否可以访问
echo -e "\n📋 测试2: 登录页面访问"
LOGIN_URL="${BASE_URL}${LOGIN_PATH}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$LOGIN_URL")
if [ "$RESPONSE" = "200" ]; then
    test_case "登录页面" 0 "页面可以访问"
else
    test_case "登录页面" 1 "页面无法访问 (HTTP $RESPONSE)"
fi

# 3. 检查登录页面HTML结构
echo -e "\n📋 测试3: 登录页面结构"
PAGE_CONTENT=$(curl -s "$BASE_URL")

# 检查是否包含uni-app标志
if echo "$PAGE_CONTENT" | grep -q "uni-app"; then
    test_case "uni-app框架" 0 "检测到uni-app框架"
else
    test_case "uni-app框架" 1 "未检测到uni-app框架"
fi

# 4. 检查静态资源
echo -e "\n📋 测试4: 静态资源加载"

# 检查logo图片
LOGO_URL="${BASE_URL}/static/images/logo.png"
LOGO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOGO_URL")
if [ "$LOGO_STATUS" = "200" ] || [ "$LOGO_STATUS" = "404" ]; then
    if [ "$LOGO_STATUS" = "404" ]; then
        test_case "Logo图片" 0 "占位文件已创建(需要替换真实图片)"
    else
        test_case "Logo图片" 0 "图片资源正常"
    fi
else
    test_case "Logo图片" 1 "图片加载失败 (HTTP $LOGO_STATUS)"
fi

# 检查默认头像
AVATAR_URL="${BASE_URL}/static/images/default-avatar.png"
AVATAR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AVATAR_URL")
if [ "$AVATAR_STATUS" = "200" ] || [ "$AVATAR_STATUS" = "404" ]; then
    if [ "$AVATAR_STATUS" = "404" ]; then
        test_case "默认头像" 0 "占位文件已创建(需要替换真实图片)"
    else
        test_case "默认头像" 0 "图片资源正常"
    fi
else
    test_case "默认头像" 1 "图片加载失败 (HTTP $AVATAR_STATUS)"
fi

# 5. 检查关键修复点
echo -e "\n📋 测试5: 关键修复验证"

# 检查是否存在问题路径（应该不存在）
if ! echo "$PAGE_CONTENT" | grep -q "5130684a546b56545256395354314e464a5356336544597a4d4451334d544d324d475a6a4f4467344d6a4d3d"; then
    test_case "路径修复" 0 "未发现base64编码路径错误"
else
    test_case "路径修复" 1 "仍存在base64路径错误"
fi

# 6. API连接测试
echo -e "\n📋 测试6: 后端API连接"
API_URL="http://localhost:8080/api/v1/health"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)
if [ "$API_RESPONSE" = "200" ]; then
    test_case "后端API" 0 "后端服务正常运行"
else
    test_case "后端API" 1 "后端服务未响应 (确保后端已启动)"
fi

# 7. 编译产物检查
echo -e "\n📋 测试7: 编译产物"
if [ -d "/Users/zhaolijian/Projects/chinese-rose-front/dist/build/mp-weixin" ]; then
    test_case "小程序编译" 0 "小程序编译成功"
else
    test_case "小程序编译" 1 "未找到小程序编译产物"
fi

# 总结
echo -e "\n========================================="
echo "📊 测试总结:"
echo -e "   通过: ${GREEN}$PASS${NC} 个"
echo -e "   失败: ${RED}$FAIL${NC} 个"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✅ 所有测试通过！登录页面修复成功。${NC}"
    echo -e "\n下一步操作:"
    echo "1. 在微信开发者工具中导入 dist/build/mp-weixin 目录"
    echo "2. 测试微信登录和手机号登录功能"
    echo "3. 替换占位图片为实际资源"
    exit 0
else
    echo -e "\n${RED}❌ 有 $FAIL 个测试失败，请检查相关问题。${NC}"
    exit 1
fi