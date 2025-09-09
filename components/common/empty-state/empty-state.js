/**
 * 空状态组件
 * 用于显示各种空状态页面
 */

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 空状态类型
    type: {
      type: String,
      value: 'default' // default, no-data, no-network, error, search, books, notes
    },

    // 标题文本
    title: {
      type: String,
      value: ''
    },

    // 描述文本
    description: {
      type: String,
      value: ''
    },

    // 图片地址
    image: {
      type: String,
      value: ''
    },

    // 按钮文本
    buttonText: {
      type: String,
      value: ''
    },

    // 是否显示按钮
    showButton: {
      type: Boolean,
      value: true
    },

    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 预定义的空状态配置
    configs: {
      default: {
        image: '/images/common/empty-default.png',
        title: '暂无内容',
        description: '这里还没有任何内容',
        buttonText: '刷新'
      },
      'no-data': {
        image: '/images/common/empty-no-data.png',
        title: '暂无数据',
        description: '暂时没有相关数据',
        buttonText: '重新加载'
      },
      'no-network': {
        image: '/images/common/empty-no-network.png',
        title: '网络连接失败',
        description: '请检查网络连接后重试',
        buttonText: '重新连接'
      },
      error: {
        image: '/images/common/empty-error.png',
        title: '出错了',
        description: '页面出现了错误，请稍后再试',
        buttonText: '重试'
      },
      search: {
        image: '/images/common/empty-search.png',
        title: '没有找到相关内容',
        description: '试试其他关键词吧',
        buttonText: '清除搜索'
      },
      books: {
        image: '/images/common/empty-books.png',
        title: '还没有任何书籍',
        description: '开始记录你的阅读之旅吧',
        buttonText: '添加书籍'
      },
      notes: {
        image: '/images/common/empty-notes.png',
        title: '还没有笔记',
        description: '记录你的阅读感悟和思考',
        buttonText: '添加笔记'
      },
      mindmap: {
        image: '/images/common/empty-mindmap.png',
        title: '暂无思维导图',
        description: '添加笔记后可以生成思维导图',
        buttonText: '去添加笔记'
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取当前配置
     */
    getCurrentConfig() {
      const { type, title, description, image, buttonText } = this.properties
      const defaultConfig = this.data.configs[type] || this.data.configs.default

      return {
        image: image || defaultConfig.image,
        title: title || defaultConfig.title,
        description: description || defaultConfig.description,
        buttonText: buttonText || defaultConfig.buttonText
      }
    },

    /**
     * 点击按钮事件
     */
    onButtonClick() {
      this.triggerEvent('buttonclick', {
        type: this.properties.type
      }, {
        bubbles: true,
        composed: true
      })
    },

    /**
     * 点击图片事件
     */
    onImageClick() {
      this.triggerEvent('imageclick', {
        type: this.properties.type
      }, {
        bubbles: true,
        composed: true
      })
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例进入页面节点树
     */
    attached() {
      // TODO: 空状态组件可以进一步抽象和复用 - 记录在CLAUDE.md前端技术债务 2025-09-05 [项目:chinese-rose-front]
      // 组件初始化逻辑
    }
  }
})
