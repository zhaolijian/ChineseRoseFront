import request from '@/utils/request'

// OCR识别参数
export interface OCRRequest {
  images: string[]  // base64图片数组
}

// OCR识别结果
export interface OCRResult {
  text: string
  confidence: number
}

// OCR响应数据
export interface OCRResponse {
  results: OCRResult[]
  totalText: string
}

/**
 * OCR图片识别
 */
export const recognizeImages = (data: OCRRequest): Promise<OCRResponse> => {
  return request.post<OCRResponse>('/v1/ocr/recognize', data)
}