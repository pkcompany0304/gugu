import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── 인증 확인 ────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { paymentKey, orderId, amount } = await request.json()

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
  }

  // ── 주문 소유권 확인 + 이중 결제 방지 ───────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, gugu_id, total_price, total_amount, payment_status, consumer_id')
    .eq('id', orderId)
    .eq('consumer_id', user.id)   // 본인 주문만
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: '이미 결제 완료된 주문입니다.' }, { status: 409 })
  }

  // ── 금액 검증 ────────────────────────────────────────────────────────────
  const expectedAmount = order.total_price ?? order.total_amount
  if (Number(amount) !== expectedAmount) {
    return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 })
  }

  // ── 토스페이먼츠 결제 승인 ───────────────────────────────────────────────
  const encryptedKey = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encryptedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  const tossData = await tossRes.json()

  if (!tossRes.ok) {
    return NextResponse.json(
      { error: tossData.message || '결제 승인에 실패했습니다.' },
      { status: tossRes.status }
    )
  }

  // ── DB 업데이트 ──────────────────────────────────────────────────────────
  await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_key: paymentKey,
    })
    .eq('id', orderId)

  // 공구 참여자 수 증가
  await supabase.rpc('increment_gonggu_participants', { p_gonggu_id: order.gugu_id })

  return NextResponse.json({ success: true, data: tossData })
}
