// 说明：原“后端代理上传”已下线，统一采用预签名直传方案。

// 预签名直传（封面专用）

import { getCoverPresign } from '@/api/modules/storage'

// 读取文件为ArrayBuffer（微信端）
export const readFileAsArrayBuffer = (filePath: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    try {
      const fs = wx.getFileSystemManager()
      fs.readFile({ filePath, success: r => resolve(r.data as ArrayBuffer), fail: reject })
      return
    } catch (e) {
      reject(e)
      return
    }
    // #endif
    // 其他端暂不支持：由调用方兜底
    reject(new Error('当前平台不支持读取本地文件为二进制'))
  })
}

// PUT直传COS
export const putToCOS = (uploadUrl: string, headers: Record<string, string>, data: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.request({ url: uploadUrl, method: 'PUT', header: headers, data, success: r => r.statusCode < 300 ? resolve() : reject(new Error('COS上传失败: '+r.statusCode)), fail: reject })
    // #endif
  })
}

// 预签名 + PUT 上传封面（返回临时key与预览URL）
export const presignAndUploadCover = async (tempFilePath: string): Promise<{ key: string; previewUrl: string }> => {
  const filename = tempFilePath.split('/').pop() || 'cover.jpg'
  const lower = filename.toLowerCase()
  const contentType = lower.endsWith('.png') ? 'image/png' : 'image/jpeg'

  const presign = await getCoverPresign({ filename, contentType })
  const { uploadUrl, headers, key, previewUrl } = presign
  const buff = await readFileAsArrayBuffer(tempFilePath)
  await putToCOS(uploadUrl, headers, buff)
  return { key, previewUrl }
}
