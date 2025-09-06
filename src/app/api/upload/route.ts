import { NextRequest, NextResponse } from 'next/server'
import { synapseSDK } from '@/lib/synapse/synapse-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const generateThumbnails = formData.get('generateThumbnails') === 'true'
    const metadataStr = formData.get('metadata') as string
    
    let metadata = {}
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr)
      } catch (error) {
        console.warn('Failed to parse metadata:', error)
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'model/obj',
      'model/gltf-binary',
      'application/octet-stream'
    ]

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 100MB` },
          { status: 400 }
        )
      }

      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        return NextResponse.json(
          { error: `File type ${file.type} is not supported` },
          { status: 400 }
        )
      }
    }

    console.log(`Starting upload of ${files.length} files...`)

    // Upload files using SynapseSDK
    const results = await synapseSDK.uploadMultipleFiles(files, {
      generateThumbnails,
      onProgress: (progress, fileName) => {
        console.log(`Upload progress: ${progress.toFixed(1)}% - ${fileName}`)
      },
      metadata
    })

    console.log('Upload completed successfully')

    return NextResponse.json({
      success: true,
      files: results,
      message: `${files.length} file(s) uploaded successfully`
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const files = await synapseSDK.listFiles({
      limit,
      offset,
      sortBy: sortBy as 'name' | 'size' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc'
    })

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        limit,
        offset,
        total: files.length
      }
    })

  } catch (error) {
    console.error('Failed to list files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    )
  }
}