import { NextRequest, NextResponse } from 'next/server'
import { filCDN } from '@/lib/filcdn/filcdn-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, // 'signed-url', 'preview', 'stream', 'prefetch', 'invalidate', 'optimize'
      cid,
      expiry,
      allowedOperations,
      allowedIPs,
      userAgent,
      width,
      height,
      format,
      quality,
      fit,
      watermark,
      range,
      subtitles,
      contentType,
      userLocation,
      deviceType,
      connectionSpeed
    } = body

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'signed-url':
        const signedUrl = await filCDN.generateSignedUrl({
          cid,
          expiry: expiry ? parseInt(expiry) : undefined,
          allowedOperations: allowedOperations || ['GET'],
          allowedIPs,
          userAgent
        })

        return NextResponse.json({
          success: true,
          signedUrl
        })

      case 'preview':
        const previewUrl = await filCDN.generatePreviewUrl({
          cid,
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          format,
          quality: quality ? parseInt(quality) : undefined,
          fit,
          watermark
        })

        return NextResponse.json({
          success: true,
          previewUrl
        })

      case 'stream':
        const streamingUrl = await filCDN.generateStreamingUrl({
          cid,
          range,
          quality,
          format,
          subtitles
        })

        return NextResponse.json({
          success: true,
          streamingUrl
        })

      case 'prefetch':
        const prefetchResult = await filCDN.prefetchContent(cid)
        
        if (prefetchResult) {
          return NextResponse.json({
            success: true,
            message: 'Content prefetched successfully',
            cid
          })
        }
        break

      case 'invalidate':
        const invalidateResult = await filCDN.invalidateCache(cid)
        
        if (invalidateResult) {
          return NextResponse.json({
            success: true,
            message: 'Cache invalidated successfully',
            cid
          })
        }
        break

      case 'optimize':
        const optimization = await filCDN.optimizeDelivery(cid, {
          contentType,
          userLocation,
          deviceType,
          connectionSpeed
        })

        return NextResponse.json({
          success: true,
          optimization
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { error: 'CDN operation failed' },
      { status: 500 }
    )

  } catch (error) {
    console.error('CDN operation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CDN operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const cid = searchParams.get('cid')

    switch (type) {
      case 'cache':
        if (!cid) {
          return NextResponse.json(
            { error: 'CID is required for cache info' },
            { status: 400 }
          )
        }

        const cacheInfo = await filCDN.getCacheInfo(cid)
        return NextResponse.json({
          success: true,
          cacheInfo
        })

      case 'analytics':
        if (!cid) {
          return NextResponse.json(
            { error: 'CID is required for analytics' },
            { status: 400 }
          )
        }

        const timeRange = searchParams.get('timeRange') || '24h'
        const granularity = searchParams.get('granularity') || 'hour'

        const analytics = await filCDN.getAnalytics(cid, {
          timeRange: timeRange as any,
          granularity: granularity as any
        })

        return NextResponse.json({
          success: true,
          analytics
        })

      case 'health':
        const health = await filCDN.healthCheck()
        return NextResponse.json({
          success: true,
          health
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('CDN API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CDN API request failed' },
      { status: 500 }
    )
  }
}