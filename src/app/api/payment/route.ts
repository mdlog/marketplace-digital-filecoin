import { NextRequest, NextResponse } from 'next/server'
import { filecoinPay } from '@/lib/filecoinpay/filecoinpay-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, // 'payment', 'escrow', 'split', 'verify'
      amount, 
      currency, 
      assetId, 
      licenseId, 
      buyerId,
      sellerId,
      escrowId,
      transactionHash,
      splitRecipients
    } = body

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID is required' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'payment':
        if (!amount || !currency || !assetId || !sellerId) {
          return NextResponse.json(
            { error: 'Amount, currency, asset ID, and seller ID are required for payment' },
            { status: 400 }
          )
        }

        // Verify asset exists and get seller info
        const asset = await db.digitalAsset.findUnique({
          where: { id: assetId },
          include: { creator: true }
        })

        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        if (asset.creator.id !== sellerId) {
          return NextResponse.json(
            { error: 'Invalid seller ID for this asset' },
            { status: 400 }
          )
        }

        // Create payment
        const paymentResult = await filecoinPay.createPayment({
          amount: parseFloat(amount),
          currency,
          recipient: sellerId,
          assetId,
          licenseId,
          buyerId,
          metadata: {
            assetTitle: asset.title,
            licenseType: licenseId ? 'premium' : 'standard'
          }
        })

        // Record transaction in database
        const transaction = await db.transaction.create({
          data: {
            hash: paymentResult.transactionHash,
            amount: parseFloat(amount),
            currency,
            status: paymentResult.status.toUpperCase() as any,
            type: 'PURCHASE',
            blockNumber: paymentResult.blockNumber,
            gasUsed: paymentResult.gasUsed,
            gasPrice: paymentResult.gasPrice,
            userId: buyerId
          }
        })

        // Create purchase record
        const purchase = await db.purchase.create({
          data: {
            amount: parseFloat(amount),
            currency,
            status: 'COMPLETED',
            transactionHash: paymentResult.transactionHash,
            buyerId,
            assetId,
            licenseId
          }
        })

        // Update transaction with purchase ID
        await db.transaction.update({
          where: { id: transaction.id },
          data: { purchaseId: purchase.id }
        })

        return NextResponse.json({
          success: true,
          payment: paymentResult,
          purchase,
          transaction
        })

      case 'escrow':
        if (!amount || !currency || !assetId || !sellerId) {
          return NextResponse.json(
            { error: 'Amount, currency, asset ID, and seller ID are required for escrow' },
            { status: 400 }
          )
        }

        // Verify asset exists
        const escrowAsset = await db.digitalAsset.findUnique({
          where: { id: assetId },
          include: { creator: true }
        })

        if (!escrowAsset || escrowAsset.creator.id !== sellerId) {
          return NextResponse.json(
            { error: 'Asset not found or invalid seller' },
            { status: 404 }
          )
        }

        // Create escrow
        const escrowInfo = await filecoinPay.createEscrow({
          amount: parseFloat(amount),
          currency,
          buyer: buyerId,
          seller: sellerId,
          assetId,
          releaseConditions: {
            minRating: 3,
            timeLock: 86400000, // 24 hours
            verificationRequired: false
          }
        })

        return NextResponse.json({
          success: true,
          escrow: escrowInfo
        })

      case 'split':
        if (!amount || !currency || !splitRecipients || !Array.isArray(splitRecipients)) {
          return NextResponse.json(
            { error: 'Amount, currency, and split recipients are required for split payment' },
            { status: 400 }
          )
        }

        // Validate split recipients
        const totalPercentage = splitRecipients.reduce((sum: number, recipient: any) => sum + recipient.percentage, 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return NextResponse.json(
            { error: 'Split percentages must sum to 100%' },
            { status: 400 }
          )
        }

        // Calculate amounts for each recipient
        const recipientsWithAmounts = splitRecipients.map((recipient: any) => ({
          address: recipient.address,
          percentage: recipient.percentage,
          amount: (parseFloat(amount) * recipient.percentage) / 100
        }))

        const splitResult = await filecoinPay.createSplitPayment({
          recipients: recipientsWithAmounts,
          totalAmount: parseFloat(amount),
          currency
        })

        return NextResponse.json({
          success: true,
          payment: splitResult
        })

      case 'verify':
        if (!transactionHash) {
          return NextResponse.json(
            { error: 'Transaction hash is required for verification' },
            { status: 400 }
          )
        }

        const verification = await filecoinPay.verifyPayment(transactionHash)
        return NextResponse.json({
          success: true,
          verification
        })

      default:
        return NextResponse.json(
          { error: 'Invalid payment type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const address = searchParams.get('address')
    const escrowId = searchParams.get('escrowId')
    const transactionHash = searchParams.get('transactionHash')

    if (type === 'history' && address) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      const txType = searchParams.get('txType') || 'all'

      const transactions = await filecoinPay.getTransactionHistory(address, {
        limit,
        offset,
        type: txType as 'sent' | 'received' | 'all'
      })

      return NextResponse.json({
        success: true,
        transactions
      })
    }

    if (type === 'escrow' && escrowId) {
      const escrowInfo = await filecoinPay.getEscrowInfo(escrowId)
      return NextResponse.json({
        success: true,
        escrow: escrowInfo
      })
    }

    if (type === 'estimate' && searchParams.has('amount') && searchParams.has('currency')) {
      const amount = parseFloat(searchParams.get('amount') || '0')
      const currency = searchParams.get('currency') || 'USD'

      const estimate = await filecoinPay.estimateGasCost(amount, currency)
      return NextResponse.json({
        success: true,
        estimate
      })
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API request failed' },
      { status: 500 }
    )
  }
}