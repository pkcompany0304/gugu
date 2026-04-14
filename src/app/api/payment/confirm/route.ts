import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type PortOnePayment = {
  id?: string
  paymentId?: string
  status?: string
  storeId?: string
  amount?: {
    total?: number
    paid?: number
  }
  totalAmount?: number
  message?: string
}

function getPaidAmount(payment: PortOnePayment) {
  return Number(payment.amount?.total ?? payment.amount?.paid ?? payment.totalAmount ?? 0)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { paymentId, orderId } = await request.json()

  if (!paymentId || !orderId) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, gugu_id, total_price, total_amount, payment_status, payment_key, consumer_id')
    .eq('id', orderId)
    .eq('consumer_id', user.id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (order.payment_status === 'paid') {
    if (order.payment_key === paymentId) {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    return NextResponse.json({ error: '이미 결제 완료된 주문입니다.' }, { status: 409 })
  }

  const apiSecret = process.env.PORTONE_API_SECRET
  if (!apiSecret) {
    return NextResponse.json({ error: 'PortOne API Secret이 설정되지 않았습니다.' }, { status: 500 })
  }

  const paymentRes = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
      },
      cache: 'no-store',
    }
  )

  const payment = await paymentRes.json() as PortOnePayment

  if (!paymentRes.ok) {
    return NextResponse.json(
      { error: payment.message || 'PortOne 결제 조회에 실패했습니다.' },
      { status: paymentRes.status }
    )
  }

  if (payment.status !== 'PAID') {
    return NextResponse.json({ error: '결제가 완료되지 않았습니다.' }, { status: 400 })
  }

  if (payment.storeId && payment.storeId !== process.env.NEXT_PUBLIC_PORTONE_STORE_ID) {
    return NextResponse.json({ error: '결제 상점 정보가 일치하지 않습니다.' }, { status: 400 })
  }

  const expectedAmount = Number(order.total_price ?? order.total_amount ?? 0)
  const paidAmount = getPaidAmount(payment)

  if (paidAmount !== expectedAmount) {
    return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_key: paymentId,
    })
    .eq('id', orderId)
    .eq('consumer_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: '주문 결제 상태 업데이트에 실패했습니다.' }, { status: 500 })
  }

  await supabase.rpc('increment_gonggu_participants', { p_gonggu_id: order.gugu_id })

  return NextResponse.json({ success: true, payment })
}
