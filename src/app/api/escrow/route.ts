import { NextRequest, NextResponse } from 'next/server'
import { filecoinPay } from '@/lib/filecoinpay/filecoinpay-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, // 'fund', 'release', 'refund'
      escrowId,
      amount,
      reason
    } = body

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }

    if (!action || !['fund', 'release', 'refund'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (fund, release, refund)' },
        { status: 400 }
      )
    }

    // Verify escrow exists first
    const escrowInfo = await filecoinPay.getEscrowInfo(escrowId)
    if (!escrowInfo) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }

    let result: boolean

    switch (action) {
      case 'fund':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Valid amount is required for funding' },
            { status: 400 }
          )
        }

        if (parseFloat(amount) !== escrowInfo.amount) {
          return NextResponse.json(
            { error: 'Amount must match escrow amount' },
            { status: 400 }
          )
        }

        result = await filecoinPay.fundEscrow(escrowId, parseFloat(amount))
        
        if (result) {
          return NextResponse.json({
            success: true,
            message: 'Escrow funded successfully',
            escrowId,
            amount: parseFloat(amount)
          })
        }
        break

      case 'release':
        result = await filecoinPay.releaseEscrow(escrowId, reason)
        
        if (result) {
          return NextResponse.json({
            success: true,
            message: 'Escrow released successfully',
            escrowId,
            reason
          })
        }
        break

      case 'refund':
        result = await filecoinPay.refundEscrow(escrowId, reason)
        
        if (result) {
          return NextResponse.json({
            success: true,
            message: 'Escrow refunded successfully',
            escrowId,
            reason
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { error: 'Escrow operation failed' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Escrow operation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Escrow operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const escrowId = searchParams.get('escrowId')

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }

    const escrowInfo = await filecoinPay.getEscrowInfo(escrowId)

    if (!escrowInfo) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      escrow: escrowInfo
    })

  } catch (error) {
    console.error('Escrow info retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve escrow info' },
      { status: 500 }
    )
  }
}