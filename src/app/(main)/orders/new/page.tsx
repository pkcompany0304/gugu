'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema, OrderInput } from '@/lib/validations/order'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils/format'
import { useAuth } from '@/lib/hooks/useAuth'

function OrderForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const guguId = searchParams.get('gugu_id') || ''
  const quantity = parseInt(searchParams.get('quantity') || '1', 10)

  const { register, handleSubmit, formState: { errors } } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: { gonggu_id: guguId, quantity },
  })

  const onSubmit = async (data: OrderInput) => {
    if (!user) return
    setLoading(true)

    const supabase = createClient()

    // 공구 가격 확인 (gugus 테이블)
    const { data: gugu } = await supabase
      .from('gugus')
      .select('gonggu_price, sale_price, title, status')
      .eq('id', data.gonggu_id)
      .single()

    if (!gugu || gugu.status !== 'active') {
      alert('참여할 수 없는 공구입니다.')
      setLoading(false)
      return
    }

    const unitPrice = gugu.gonggu_price ?? gugu.sale_price
    const totalPrice = unitPrice * data.quantity

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        consumer_id: user.id,           // 기존 컬럼명
        gugu_id: data.gonggu_id,
        quantity: data.quantity,
        unit_price: unitPrice,
        total_amount: totalPrice,        // 기존 컬럼명
        total_price: totalPrice,         // 추가 컬럼
        order_number: `GG${Date.now()}`,
        shipping_name: data.shipping_name,
        shipping_phone: data.shipping_phone,
        shipping_address: data.shipping_address,
        shipping_detail: data.shipping_address_detail,  // 기존 컬럼명
        shipping_zip: data.shipping_zipcode,             // 기존 컬럼명
        shipping_zipcode: data.shipping_zipcode,
      })
      .select()
      .single()

    if (error || !order) {
      console.error(error)
      alert('주문 처리 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }

    router.push(`/orders/${order.id}/payment`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">주문하기</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('gonggu_id')} />
        <input type="hidden" {...register('quantity', { valueAsNumber: true })} />

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">배송 정보</h2>

          <div className="space-y-3">
            {[
              { name: 'shipping_name' as const, label: '받는 분 *', placeholder: '이름 입력' },
              { name: 'shipping_phone' as const, label: '연락처 *', placeholder: '010-0000-0000', type: 'tel' },
              { name: 'shipping_zipcode' as const, label: '우편번호 *', placeholder: '12345', maxLength: 5 },
              { name: 'shipping_address' as const, label: '주소 *', placeholder: '기본 주소' },
              { name: 'shipping_address_detail' as const, label: '', placeholder: '상세 주소 (선택)' },
            ].map(({ name, label, placeholder, type, maxLength }) => (
              <div key={name}>
                {label && <label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</label>}
                <input
                  {...register(name)}
                  type={type || 'text'}
                  maxLength={maxLength}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder={placeholder}
                />
                {errors[name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>
                )}
              </div>
            ))}

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">배송 메모</label>
              <input
                {...register('memo')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder="배송 시 요청사항 (선택)"
              />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          결제하기
        </Button>
      </form>
    </div>
  )
}

export default function NewOrderPage() {
  return <Suspense><OrderForm /></Suspense>
}
