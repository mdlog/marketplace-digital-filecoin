import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const userId = searchParams.get('userId')

    if (!walletAddress && !userId) {
      return NextResponse.json(
        { error: 'Wallet address or user ID is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: walletAddress ? { walletAddress } : { id: userId || '' },
      include: {
        assets: {
          where: { isPublished: true },
          include: {
            category: true,
            _count: {
              select: {
                purchases: true,
                reviews: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        purchases: {
          include: {
            asset: {
              include: {
                category: true,
                creator: {
                  select: {
                    id: true,
                    name: true,
                    walletAddress: true
                  }
                }
              }
            },
            license: true
          },
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          include: {
            asset: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate user statistics
    const stats = {
      totalAssets: user.assets.length,
      totalPurchases: user.purchases.length,
      totalReviews: user.reviews.length,
      totalSales: user.assets.reduce((sum, asset) => sum + asset._count.purchases, 0),
      averageRating: user.reviews.length > 0 
        ? user.reviews.reduce((sum, review) => sum + review.rating, 0) / user.reviews.length 
        : 0
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        bio: user.bio,
        isCreator: user.isCreator,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      assets: user.assets,
      purchases: user.purchases,
      reviews: user.reviews,
      stats
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}