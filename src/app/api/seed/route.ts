import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Create sample categories
    const categories = await Promise.all([
      db.category.upsert({
        where: { name: 'Images' },
        update: {},
        create: {
          name: 'Images',
          description: 'Digital images, photos, and graphics',
          icon: '🖼️',
          color: 'blue'
        }
      }),
      db.category.upsert({
        where: { name: 'Videos' },
        update: {},
        create: {
          name: 'Videos',
          description: 'Video content and animations',
          icon: '🎥',
          color: 'red'
        }
      }),
      db.category.upsert({
        where: { name: 'Audio' },
        update: {},
        create: {
          name: 'Audio',
          description: 'Music, sound effects, and audio files',
          icon: '🎵',
          color: 'green'
        }
      }),
      db.category.upsert({
        where: { name: 'Documents' },
        update: {},
        create: {
          name: 'Documents',
          description: 'PDFs, text files, and documents',
          icon: '📄',
          color: 'gray'
        }
      }),
      db.category.upsert({
        where: { name: '3D Models' },
        update: {},
        create: {
          name: '3D Models',
          description: '3D models and CAD files',
          icon: '🎲',
          color: 'purple'
        }
      }),
      db.category.upsert({
        where: { name: 'Software' },
        update: {},
        create: {
          name: 'Software',
          description: 'Applications, tools, and code',
          icon: '💻',
          color: 'orange'
        }
      })
    ])

    // Create sample users
    const users = await Promise.all([
      db.user.upsert({
        where: { email: 'creator1@example.com' },
        update: {},
        create: {
          email: 'creator1@example.com',
          name: 'Digital Creator',
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          isCreator: true
        }
      }),
      db.user.upsert({
        where: { email: 'creator2@example.com' },
        update: {},
        create: {
          email: 'creator2@example.com',
          name: 'Content Producer',
          walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
          isCreator: true
        }
      })
    ])

    // Create sample assets
    const assets = await Promise.all([
      db.digitalAsset.create({
        data: {
          title: 'Beautiful Landscape Photo',
          description: 'Stunning high-resolution landscape photograph captured at sunset',
          price: 25.00,
          currency: 'USD',
          tags: JSON.stringify(['nature', 'landscape', 'photography', 'sunset']),
          isPublished: true,
          isFeatured: true,
          views: 150,
          downloads: 45,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
          fileSize: 5242880, // 5MB
          fileType: 'image/jpeg',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uct',
          creatorId: users[0].id,
          categoryId: categories[0].id
        }
      }),
      db.digitalAsset.create({
        data: {
          title: 'Corporate Video Template',
          description: 'Professional video template for corporate presentations',
          price: 75.00,
          currency: 'USD',
          tags: JSON.stringify(['video', 'template', 'corporate', 'business']),
          isPublished: true,
          views: 89,
          downloads: 12,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd',
          fileSize: 104857600, // 100MB
          fileType: 'video/mp4',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uce',
          creatorId: users[1].id,
          categoryId: categories[1].id
        }
      }),
      db.digitalAsset.create({
        data: {
          title: 'Ambient Music Collection',
          description: 'Collection of relaxing ambient music tracks',
          price: 15.00,
          currency: 'USD',
          tags: JSON.stringify(['music', 'ambient', 'relaxing', 'audio']),
          isPublished: true,
          isFeatured: true,
          views: 234,
          downloads: 67,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucf',
          fileSize: 31457280, // 30MB
          fileType: 'audio/mp3',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucg',
          creatorId: users[0].id,
          categoryId: categories[2].id
        }
      }),
      db.digitalAsset.create({
        data: {
          title: 'Business Proposal Template',
          description: 'Professional business proposal template in PDF format',
          price: 10.00,
          currency: 'USD',
          tags: JSON.stringify(['template', 'business', 'pdf', 'document']),
          isPublished: true,
          views: 312,
          downloads: 89,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uch',
          fileSize: 1048576, // 1MB
          fileType: 'application/pdf',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uci',
          creatorId: users[1].id,
          categoryId: categories[3].id
        }
      }),
      db.digitalAsset.create({
        data: {
          title: '3D Character Model',
          description: 'High-quality 3D character model for games and animations',
          price: 120.00,
          currency: 'USD',
          tags: JSON.stringify(['3d', 'character', 'model', 'game']),
          isPublished: true,
          views: 78,
          downloads: 8,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucj',
          fileSize: 52428800, // 50MB
          fileType: 'model/obj',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uck',
          creatorId: users[0].id,
          categoryId: categories[4].id
        }
      }),
      db.digitalAsset.create({
        data: {
          title: 'Code Snippets Library',
          description: 'Collection of useful code snippets for developers',
          price: 35.00,
          currency: 'USD',
          tags: JSON.stringify(['code', 'snippets', 'development', 'programming']),
          isPublished: true,
          views: 145,
          downloads: 34,
          cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucl',
          fileSize: 2097152, // 2MB
          fileType: 'application/zip',
          thumbnailCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucm',
          creatorId: users[1].id,
          categoryId: categories[5].id
        }
      })
    ])

    return NextResponse.json({
      message: 'Database seeded successfully',
      categories: categories.length,
      users: users.length,
      assets: assets.length
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}