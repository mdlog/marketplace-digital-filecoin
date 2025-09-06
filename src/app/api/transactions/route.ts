import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'all', 'sent', 'received'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: any = { userId }
    
    if (type && type !== 'all') {
      // For sent/received filtering, we would need to join with purchases
      // This is a simplified version - in real implementation, you'd have more complex logic
      if (type === 'sent') {
        // Show transactions where user is the buyer
        where.purchase = {
          buyerId: userId
        }
      } else if (type === 'received') {
        // Show transactions where user is the seller (asset creator)
        where.purchase = {
          asset: {
            creatorId: userId
          }
        }
      }
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          purchase: {
            include: {
              asset: {
                select: {
                  id: true,
                  title: true,
                  thumbnailCid: true
                }
              },
              buyer: {
                select: {
                  id: true,
                  name: true,
                  walletAddress: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}