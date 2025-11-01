import request from '@/utils/request'

// 预签名直传 - 生成封面上传URL（临时路径）
export interface CoverPresignParams {
  filename: string
  contentType: string
}

export interface CoverPresignResp {
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
  key: string
  previewUrl: string
  expiresIn: number
}

export const getCoverPresign = (params: CoverPresignParams): Promise<CoverPresignResp> => {
  return request.post<CoverPresignResp>('/v1/storage/cover/presign', params)
}

// 主动回收未使用的临时对象
export const deleteTempObject = (key: string): Promise<void> => {
  return request.delete<void>('/v1/storage/temp', { data: { key } })
}
