import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would verify the signature here
    // For now, we'll just check if the wallet address exists or create a new user

    let user = await db.user.findUnique({
      where: { walletAddress }
    })

    if (!user) {
      // Create new user with wallet address
      user = await db.user.create({
        data: {
          email: `${walletAddress.toLowerCase()}@filecoin-marketplace.local`,
          walletAddress,
          isCreator: false
        }
      })
    }

    // Create a simple session token (in production, use proper JWT)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        isCreator: user.isCreator
      },
      sessionToken
    })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, bio, isCreator } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(isCreator !== undefined && { isCreator })
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      walletAddress: updatedUser.walletAddress,
      bio: updatedUser.bio,
      isCreator: updatedUser.isCreator
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}