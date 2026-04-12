import { z } from 'zod'

export const orderSchema = z.object({
  gonggu_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
  shipping_name: z.string().min(2, '이름을 입력해주세요'),
  shipping_phone: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  shipping_zipcode: z.string().length(5, '우편번호 5자리를 입력해주세요'),
  shipping_address: z.string().min(5, '주소를 입력해주세요'),
  shipping_address_detail: z.string().optional(),
  memo: z.string().max(200, '메모는 200자 이내로 입력해주세요').optional(),
})

export type OrderInput = z.infer<typeof orderSchema>
