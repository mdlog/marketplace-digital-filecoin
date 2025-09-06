import { NextRequest, NextResponse } from 'next/server'
import { pdpService } from '@/lib/pdp/pdp-service'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const user = searchParams.get('user')
    const assetId = searchParams.get('assetId')
    const tokenId = searchParams.get('tokenId')

    switch (type) {
      case 'templates':
        const templates = await pdpService.getLicenseTemplates()
        return NextResponse.json({
          success: true,
          templates
        })

      case 'user':
        if (!user) {
          return NextResponse.json(
            { error: 'User address is required' },
            { status: 400 }
          )
        }

        const userLicenses = await pdpService.getUserLicenses(user)
        return NextResponse.json({
          success: true,
          licenses: userLicenses
        })

      case 'asset':
        if (!assetId) {
          return NextResponse.json(
            { error: 'Asset ID is required' },
            { status: 400 }
          )
        }

        const assetLicenses = await pdpService.getAssetLicenses(assetId)
        return NextResponse.json({
          success: true,
          licenses: assetLicenses
        })

      case 'verify':
        if (!tokenId) {
          return NextResponse.json(
            { error: 'Token ID is required' },
            { status: 400 }
          )
        }

        const owner = searchParams.get('owner')
        const verification = await pdpService.verifyLicense(tokenId, owner || undefined)
        return NextResponse.json({
          success: true,
          verification
        })

      case 'metadata':
        if (!tokenId) {
          return NextResponse.json(
            { error: 'Token ID is required' },
            { status: 400 }
          )
        }

        const metadata = await pdpService.getLicenseMetadata(tokenId)
        return NextResponse.json({
          success: true,
          metadata
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('License API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'License operation failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, // 'mint', 'transfer', 'use', 'burn'
      tokenId,
      assetId,
      licenseTemplateId,
      purchaser,
      from,
      to,
      user,
      duration,
      maxUses,
      metadata
    } = body

    switch (action) {
      case 'mint':
        if (!assetId || !licenseTemplateId || !purchaser) {
          return NextResponse.json(
            { error: 'Asset ID, license template ID, and purchaser are required for minting' },
            { status: 400 }
          )
        }

        // Verify asset exists
        const asset = await db.digitalAsset.findUnique({
          where: { id: assetId }
        })

        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        // Mint license NFT
        const mintRequest = {
          assetId,
          licenseTemplateId,
          purchaser,
          duration: duration ? parseInt(duration) : undefined,
          maxUses: maxUses ? parseInt(maxUses) : undefined,
          metadata: metadata || {}
        }

        const licenseNFT = await pdpService.mintLicense(mintRequest)

        // Create license record in database
        const license = await db.license.create({
          data: {
            type: licenseTemplateId,
            price: asset.price * (licenseTemplateId === 'extended' ? 2 : licenseTemplateId === 'exclusive' ? 5 : 1),
            description: `Digital license for ${asset.title}`,
            duration: duration ? parseInt(duration) : undefined,
            maxUses: maxUses ? parseInt(maxUses) : undefined,
            assetId,
            purchaserId: purchaser
          }
        })

        return NextResponse.json({
          success: true,
          licenseNFT,
          license
        })

      case 'transfer':
        if (!tokenId || !from || !to) {
          return NextResponse.json(
            { error: 'Token ID, from address, and to address are required for transfer' },
            { status: 400 }
          )
        }

        const transferResult = await pdpService.transferLicense(tokenId, from, to)

        if (transferResult) {
          return NextResponse.json({
            success: true,
            message: 'License transferred successfully',
            tokenId,
            from,
            to
          })
        }
        break

      case 'use':
        if (!tokenId || !user) {
          return NextResponse.json(
            { error: 'Token ID and user are required for license use' },
            { status: 400 }
          )
        }

        const useResult = await pdpService.useLicense(tokenId, user)
        return NextResponse.json({
          success: useResult.success,
          remainingUses: useResult.remainingUses,
          message: useResult.message
        })

      case 'burn':
        if (!tokenId || !user) {
          return NextResponse.json(
            { error: 'Token ID and owner are required for burning' },
            { status: 400 }
          )
        }

        const burnResult = await pdpService.burnLicense(tokenId, user)

        if (burnResult) {
          return NextResponse.json({
            success: true,
            message: 'License burned successfully',
            tokenId
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { error: 'License operation failed' },
      { status: 500 }
    )

  } catch (error) {
    console.error('License operation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'License operation failed' },
      { status: 500 }
    )
  }
}