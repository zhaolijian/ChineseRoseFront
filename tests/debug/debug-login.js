// 调试登录问题的脚本
// 在浏览器控制台运行此脚本

// 1. 检查当前存储的token
console.log('=== 检查存储状态 ===');
const tokenData = localStorage.getItem('chinese_rose_token');
const userInfoData = localStorage.getItem('chinese_rose_userInfo');

if (tokenData) {
    try {
        const tokenObj = JSON.parse(tokenData);
        console.log('Token对象:', tokenObj);
        
        if (tokenObj.value) {
            const parts = tokenObj.value.split('.');
            if (parts.length === 3) {
                // 使用atob解码（浏览器环境）
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token payload:', payload);
                
                const now = Math.floor(Date.now() / 1000);
                console.log('当前时间戳:', now);
                console.log('Token过期时间戳:', payload.exp);
                console.log('是否过期:', payload.exp <= now);
                
                if (payload.exp <= now) {
                    const expDate = new Date(payload.exp * 1000);
                    console.log('Token已过期于:', expDate.toLocaleString());
                }
            }
        }
    } catch (e) {
        console.error('解析token失败:', e);
    }
} else {
    console.log('未找到token');
}

if (userInfoData) {
    try {
        const userInfo = JSON.parse(userInfoData);
        console.log('用户信息:', userInfo.value);
    } catch (e) {
        console.error('解析用户信息失败:', e);
    }
} else {
    console.log('未找到用户信息');
}

// 2. 创建测试token（1小时有效期）
function createValidToken() {
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        user_id: 1,
        exp: now + 3600, // 1小时后过期
        iat: now,
        nbf: now
    }));
    return `${header}.${payload}.signature`;
}

// 3. 设置测试数据
function setTestData() {
    const token = createValidToken();
    const tokenData = {
        value: token,
        timestamp: Date.now(),
        expires: null
    };
    
    const userInfo = {
        id: 1,
        phone: '13800000000',
        nickname: '测试用户',
        openID: 'test_openid'
    };
    
    const userInfoData = {
        value: userInfo,
        timestamp: Date.now(),
        expires: null
    };
    
    localStorage.setItem('chinese_rose_token', JSON.stringify(tokenData));
    localStorage.setItem('chinese_rose_userInfo', JSON.stringify(userInfoData));
    
    console.log('已设置测试token和用户信息');
    console.log('Token:', token);
    console.log('UserInfo:', userInfo);
    
    return { token, userInfo };
}

// 4. 清除登录数据
function clearLoginData() {
    localStorage.removeItem('chinese_rose_token');
    localStorage.removeItem('chinese_rose_userInfo');
    console.log('已清除登录数据');
}

// 导出函数供控制台使用
window.debugLogin = {
    checkStorage: () => {
        console.log('Token:', localStorage.getItem('chinese_rose_token'));
        console.log('UserInfo:', localStorage.getItem('chinese_rose_userInfo'));
    },
    setTestData,
    clearLoginData,
    createValidToken
};

console.log('\n可用命令:');
console.log('debugLogin.checkStorage() - 检查存储状态');
console.log('debugLogin.setTestData() - 设置测试登录数据');
console.log('debugLogin.clearLoginData() - 清除登录数据');
console.log('debugLogin.createValidToken() - 创建有效token');