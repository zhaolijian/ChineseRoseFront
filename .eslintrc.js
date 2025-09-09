module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'standard'
  ],
  globals: {
    // 微信小程序全局变量
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
    Behavior: 'readonly',
    
    // 自定义全局变量
    __wxConfig: 'readonly',
    __wxRoute: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // 代码风格
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    
    // 最佳实践
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    
    // 小程序特殊规则
    'camelcase': ['error', {
      allow: [
        'app_id',
        'app_secret', 
        'access_token',
        'open_id',
        'union_id',
        'session_key'
      ]
    }]
  }
}