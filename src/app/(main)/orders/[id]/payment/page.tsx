'use client'

import * as PortOne from '@portone/browser-sdk/v2'
import BackButton from '@/components/ui/BackButton'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils/format'
import { CreditCard } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type PaymentOrder = {
  id: string
  order_number: string | null
  quantity: number
  total_price: number | null
  total_amount: number | null
  payment_status: string | null
  gugu: {
    title: string | null
    product_name: string | null
    thumbnail_url: string | null
    image_url: string | null
  } | null
}

type PaymentOrderQueryResult = Omit<PaymentOrder, 'gugu'> & {
  gugu: PaymentOrder['gugu'] | PaymentOrder['gugu'][]
}

function buildPaymentId(orderId: string) {
  const compactOrderId = orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 24)
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return `gugu-${compactOrderId}-${Date.now()}-${random}`
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = useMemo(() => {
    if (!order) return 0
    return Number(order.total_price ?? order.total_amount ?? 0)
  }, [order])

  const orderName = useMemo(() => {
    const title = order?.gugu?.title ?? order?.gugu?.product_name ?? '구구 공동구매 주문'
    return order?.quantity ? `${title} ${order.quantity}개` : title
  }, [order])

  useEffect(() => {
    const loadOrder = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, quantity, total_price, total_amount, payment_status, gugu:gugus(title, product_name, thumbnail_url, image_url)')
        .eq('id', orderId)
        .single()

      if (error || !data) {
        setError('주문 정보를 불러오지 못했습니다.')
      } else {
        const result = data as unknown as PaymentOrderQueryResult
        setOrder({
          ...result,
          gugu: Array.isArray(result.gugu) ? result.gugu[0] ?? null : result.gugu,
        })
      }
      setLoading(false)
    }

    loadOrder()
  }, [orderId])

  const handlePayment = async () => {
    if (!order || totalAmount <= 0) {
      setError('결제 금액이 올바르지 않습니다.')
      return
    }

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

    if (!storeId || !channelKey) {
      setError('PortOne 결제 환경변수가 설정되지 않았습니다.')
      return
    }

    setPaying(true)
    setError(null)

    try {
      const paymentId = buildPaymentId(order.id)
      const redirectUrl = `${window.location.origin}/orders/${order.id}/payment/success?paymentId=${encodeURIComponent(paymentId)}`

      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName,
        totalAmount,
        currency: 'KRW',
        payMethod: 'CARD',
        redirectUrl,
        customData: {
          orderId: order.id,
        },
      })

      if (!response) {
        setError('결제가 취소되었습니다.')
        return
      }

      if (response.code) {
        router.push(
          `/orders/${order.id}/payment/fail?code=${encodeURIComponent(response.code)}&message=${encodeURIComponent(response.message ?? '결제에 실패했습니다.')}`
        )
        return
      }

      const confirmRes = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentId: response.paymentId,
        }),
      })

      if (!confirmRes.ok) {
        const data = await confirmRes.json().catch(() => null)
        throw new Error(data?.error ?? '결제 확인에 실패했습니다.')
      }

      router.replace(`/orders/${order.id}/payment/success?paymentId=${encodeURIComponent(response.paymentId)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 h-14 flex items-center gap-3 max-w-lg mx-auto">
          <BackButton className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50" />
          <h1 className="text-base font-black text-gray-900">결제하기</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-semibold">PortOne 테스트 결제</p>
              <h2 className="text-lg font-black text-gray-900">카드 결제</h2>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm font-semibold text-gray-400">주문 정보를 불러오는 중...</div>
          ) : order ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-400 mb-1">주문 상품</p>
                <p className="text-sm font-bold text-gray-900">{orderName}</p>
                {order.order_number && (
                  <p className="text-xs text-gray-400 mt-1">주문번호 {order.order_number}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">총 결제금액</span>
                <span className="text-xl font-black text-red-500">{formatPrice(totalAmount)}</span>
              </div>

              {order.payment_status === 'paid' ? (
                <Button className="w-full" size="lg" disabled>
                  이미 결제 완료된 주문입니다
                </Button>
              ) : (
                <Button className="w-full" size="lg" loading={paying} onClick={handlePayment}>
                  PortOne으로 결제하기
                </Button>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-sm font-semibold text-red-400">
              주문 정보를 확인할 수 없습니다.
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
