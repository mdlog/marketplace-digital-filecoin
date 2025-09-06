import { NextRequest, NextResponse } from 'next/server'
import { synapseSDK } from '@/lib/synapse/synapse-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  try {
    const cid = params.cid
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'
    const expiry = searchParams.get('expiry')

    switch (action) {
      case 'info':
        const fileInfo = await synapseSDK.getFileInfo(cid)
        return NextResponse.json({
          success: true,
          data: fileInfo
        })

      case 'signed-url':
        const signedUrl = await synapseSDK.createSignedUrl(cid, {
          expiry: expiry ? parseInt(expiry) : undefined
        })
        return NextResponse.json({
          success: true,
          data: { signedUrl }
        })

      case 'verify':
        const expectedSize = searchParams.get('size')
        const isValid = await synapseSDK.verifyFileIntegrity(
          cid, 
          expectedSize ? parseInt(expectedSize) : undefined
        )
        return NextResponse.json({
          success: true,
          data: { isValid }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error(`File API error for CID ${params.cid}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'File operation failed' },
      { status: 500 }
    )
  }
}