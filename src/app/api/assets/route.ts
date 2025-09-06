import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const fileType = searchParams.get('fileType')
    const isFeatured = searchParams.get('isFeatured')
    const creator = searchParams.get('creator')

    const where: any = {
      isPublished: true
    }

    if (category && category !== 'all') {
      where.category = {
        name: category
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (minPrice) {
      where.price = { gte: parseFloat(minPrice) }
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) }
    }

    if (fileType) {
      where.fileType = { contains: fileType, mode: 'insensitive' }
    }

    if (isFeatured === 'true') {
      where.isFeatured = true
    }

    if (creator) {
      where.creator = {
        OR: [
          { name: { contains: creator, mode: 'insensitive' } },
          { walletAddress: { contains: creator, mode: 'insensitive' } }
        ]
      }
    }

    const orderBy: any = {
      createdAt: 'desc'
    }

    switch (sortBy) {
      case 'price-low':
        orderBy.price = 'asc'
        break
      case 'price-high':
        orderBy.price = 'desc'
        break
      case 'popular':
        orderBy.views = 'desc'
        break
      case 'downloads':
        orderBy.downloads = 'desc'
      case 'rating':
        orderBy.reviews = {
          _count: 'desc'
        }
        break
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
    }

    const skip = (page - 1) * limit

    const [assets, total] = await Promise.all([
      db.digitalAsset.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          _count: {
            select: {
              purchases: true,
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      db.digitalAsset.count({ where })
    ])

    // Calculate average rating for each asset
    const assetsWithRating = await Promise.all(
      assets.map(async (asset) => {
        const reviews = await db.review.findMany({
          where: { assetId: asset.id },
          select: { rating: true }
        })
        
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...asset,
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: reviews.length
        }
      })
    )

    return NextResponse.json({
      assets: assetsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      price,
      currency = 'USD',
      tags,
      categoryId,
      creatorId,
      cid,
      fileSize,
      fileType,
      thumbnailCid
    } = body

    if (!title || !price || !creatorId) {
      return NextResponse.json(
        { error: 'Title, price, and creator ID are required' },
        { status: 400 }
      )
    }

    const asset = await db.digitalAsset.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        currency,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
        categoryId,
        creatorId,
        cid,
        fileSize,
        fileType,
        thumbnailCid
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}