import ZAI from 'z-ai-web-dev-sdk'

export interface LicenseTemplate {
  id: string
  name: string
  description: string
  type: 'standard' | 'extended' | 'exclusive' | 'custom'
  permissions: string[]
  restrictions: string[]
  duration?: number // in days, null = perpetual
  maxUses?: number // null = unlimited
  isTransferable: boolean
  isResellable: boolean
  priceMultiplier: number // multiplier on base asset price
}

export interface MintLicenseRequest {
  assetId: string
  licenseTemplateId: string
  purchaser: string
  duration?: number
  maxUses?: number
  metadata?: Record<string, any>
}

export interface LicenseNFT {
  tokenId: string
  contractAddress: string
  assetId: string
  licenseTemplateId: string
  owner: string
  creator: string
  mintedAt: number
  expiresAt?: number
  maxUses?: number
  usedCount: number
  metadata: Record<string, any>
  uri?: string
}

export interface LicenseVerification {
  isValid: boolean
  tokenId: string
  owner: string
  assetId: string
  licenseType: string
  expiresAt?: number
  remainingUses?: number
  permissions: string[]
}

export interface PDPConfig {
  contractAddress?: string
  network?: 'mainnet' | 'testnet' | 'devnet'
  apiKey?: string
  timeout?: number
}

export class PDPService {
  private config: PDPConfig
  private zai: any

  constructor(config: PDPConfig = {}) {
    this.config = {
      contractAddress: config.contractAddress || process.env.PDP_CONTRACT_ADDRESS,
      network: config.network || 'devnet',
      timeout: config.timeout || 300000,
      ...config
    }
  }

  async initialize(): Promise<void> {
    try {
      this.zai = await ZAI.create()
      console.log('PDP service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize PDP service:', error)
      throw new Error('PDP initialization failed')
    }
  }

  async getLicenseTemplates(): Promise<LicenseTemplate[]> {
    try {
      console.log('Fetching license templates')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const templates: LicenseTemplate[] = [
        {
          id: 'standard',
          name: 'Standard License',
          description: 'Personal use, single project, non-commercial',
          type: 'standard',
          permissions: ['view', 'download', 'personal-use'],
          restrictions: ['no-commercial', 'no-resale', 'no-distribution'],
          duration: null,
          maxUses: 1,
          isTransferable: false,
          isResellable: false,
          priceMultiplier: 1.0
        },
        {
          id: 'extended',
          name: 'Extended License',
          description: 'Commercial use, multiple projects, up to 5 uses',
          type: 'extended',
          permissions: ['view', 'download', 'commercial-use', 'multiple-projects'],
          restrictions: ['no-resale', 'no-distribution'],
          duration: 365,
          maxUses: 5,
          isTransferable: true,
          isResellable: false,
          priceMultiplier: 2.0
        },
        {
          id: 'exclusive',
          name: 'Exclusive License',
          description: 'Full ownership, unlimited use, commercial rights',
          type: 'exclusive',
          permissions: ['view', 'download', 'commercial-use', 'unlimited-projects', 'resale', 'distribution', 'modification'],
          restrictions: [],
          duration: null,
          maxUses: null,
          isTransferable: true,
          isResellable: true,
          priceMultiplier: 5.0
        }
      ]

      return templates

    } catch (error) {
      console.error('Failed to fetch license templates:', error)
      throw new Error(`Failed to fetch license templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async mintLicense(request: MintLicenseRequest): Promise<LicenseNFT> {
    if (!this.zai) {
      await this.initialize()
    }

    try {
      console.log('Minting license NFT:', request)

      // Get license template
      const templates = await this.getLicenseTemplates()
      const template = templates.find(t => t.id === request.licenseTemplateId)
      
      if (!template) {
        throw new Error('License template not found')
      }

      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000))

      const tokenId = this.generateTokenId()
      const contractAddress = this.config.contractAddress || '0x1234567890abcdef1234567890abcdef12345678'
      
      const licenseNFT: LicenseNFT = {
        tokenId,
        contractAddress,
        assetId: request.assetId,
        licenseTemplateId: request.licenseTemplateId,
        owner: request.purchaser,
        creator: '0x9876543210fedcba9876543210fedcba98765432', // Mock creator
        mintedAt: Date.now(),
        expiresAt: request.duration ? Date.now() + (request.duration * 86400000) : undefined,
        maxUses: request.maxUses || template.maxUses,
        usedCount: 0,
        metadata: {
          ...request.metadata,
          templateName: template.name,
          permissions: template.permissions,
          restrictions: template.restrictions,
          isTransferable: template.isTransferable,
          isResellable: template.isResellable
        },
        uri: `ipfs://QmLicense${tokenId}`
      }

      console.log('License NFT minted successfully:', licenseNFT)
      return licenseNFT

    } catch (error) {
      console.error('License minting failed:', error)
      throw new Error(`Failed to mint license: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async verifyLicense(tokenId: string, owner?: string): Promise<LicenseVerification> {
    try {
      console.log(`Verifying license ${tokenId} for owner ${owner || 'any'}`)

      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock verification result
      const isValid = Math.random() > 0.1 // 90% success rate for demo
      
      if (!isValid) {
        return {
          isValid: false,
          tokenId,
          owner: owner || '0x0000000000000000000000000000000000000000',
          assetId: 'asset_123',
          licenseType: 'standard',
          permissions: []
        }
      }

      const verification: LicenseVerification = {
        isValid: true,
        tokenId,
        owner: owner || '0x1234567890abcdef1234567890abcdef12345678',
        assetId: 'asset_123',
        licenseType: 'extended',
        expiresAt: Date.now() + (30 * 86400000), // 30 days from now
        remainingUses: 3,
        permissions: ['view', 'download', 'commercial-use', 'multiple-projects']
      }

      return verification

    } catch (error) {
      console.error('License verification failed:', error)
      throw new Error(`Failed to verify license: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async transferLicense(tokenId: string, from: string, to: string): Promise<boolean> {
    try {
      console.log(`Transferring license ${tokenId} from ${from} to ${to}`)

      // Verify license ownership first
      const verification = await this.verifyLicense(tokenId, from)
      
      if (!verification.isValid || verification.owner !== from) {
        throw new Error('License not owned by sender or invalid')
      }

      // Simulate transfer process
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log(`License ${tokenId} transferred successfully`)
      return true

    } catch (error) {
      console.error('License transfer failed:', error)
      throw new Error(`Failed to transfer license: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async useLicense(tokenId: string, user: string): Promise<{
    success: boolean
    remainingUses?: number
    message?: string
  }> {
    try {
      console.log(`Using license ${tokenId} for user ${user}`)

      // Verify license first
      const verification = await this.verifyLicense(tokenId, user)
      
      if (!verification.isValid) {
        return {
          success: false,
          message: 'Invalid license'
        }
      }

      if (verification.expiresAt && verification.expiresAt < Date.now()) {
        return {
          success: false,
          message: 'License expired'
        }
      }

      if (verification.remainingUses !== undefined && verification.remainingUses <= 0) {
        return {
          success: false,
          message: 'No remaining uses'
        }
      }

      // Simulate license use
      await new Promise(resolve => setTimeout(resolve, 500))

      const remainingUses = verification.remainingUses !== undefined 
        ? verification.remainingUses - 1 
        : undefined

      return {
        success: true,
        remainingUses,
        message: 'License used successfully'
      }

    } catch (error) {
      console.error('License use failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to use license'
      }
    }
  }

  async getUserLicenses(user: string): Promise<LicenseNFT[]> {
    try {
      console.log(`Getting licenses for user ${user}`)

      // Simulate fetching user licenses
      await new Promise(resolve => setTimeout(resolve, 1000))

      const licenses: LicenseNFT[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        tokenId: this.generateTokenId(),
        contractAddress: this.config.contractAddress || '0x1234567890abcdef1234567890abcdef12345678',
        assetId: `asset_${i + 1}`,
        licenseTemplateId: ['standard', 'extended', 'exclusive'][Math.floor(Math.random() * 3)],
        owner: user,
        creator: '0x9876543210fedcba9876543210fedcba98765432',
        mintedAt: Date.now() - (i * 86400000),
        expiresAt: Math.random() > 0.5 ? Date.now() + (30 * 86400000) : undefined,
        maxUses: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined,
        usedCount: Math.floor(Math.random() * 3),
        metadata: {
          templateName: ['Standard', 'Extended', 'Exclusive'][Math.floor(Math.random() * 3)],
          permissions: ['view', 'download'],
          restrictions: []
        },
        uri: `ipfs://QmLicense${this.generateTokenId()}`
      }))

      return licenses

    } catch (error) {
      console.error('Failed to get user licenses:', error)
      throw new Error(`Failed to get user licenses: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAssetLicenses(assetId: string): Promise<LicenseNFT[]> {
    try {
      console.log(`Getting licenses for asset ${assetId}`)

      // Simulate fetching asset licenses
      await new Promise(resolve => setTimeout(resolve, 800))

      const licenses: LicenseNFT[] = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
        tokenId: this.generateTokenId(),
        contractAddress: this.config.contractAddress || '0x1234567890abcdef1234567890abcdef12345678',
        assetId,
        licenseTemplateId: ['standard', 'extended', 'exclusive'][Math.floor(Math.random() * 3)],
        owner: `0x${Math.random().toString(16).substr(2, 40)}`,
        creator: '0x9876543210fedcba9876543210fedcba98765432',
        mintedAt: Date.now() - (i * 86400000 * 7),
        expiresAt: Math.random() > 0.3 ? Date.now() + (90 * 86400000) : undefined,
        maxUses: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 1 : undefined,
        usedCount: Math.floor(Math.random() * 5),
        metadata: {
          templateName: ['Standard', 'Extended', 'Exclusive'][Math.floor(Math.random() * 3)],
          permissions: ['view', 'download', 'commercial-use'],
          restrictions: []
        },
        uri: `ipfs://QmLicense${this.generateTokenId()}`
      }))

      return licenses

    } catch (error) {
      console.error('Failed to get asset licenses:', error)
      throw new Error(`Failed to get asset licenses: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async burnLicense(tokenId: string, owner: string): Promise<boolean> {
    try {
      console.log(`Burning license ${tokenId} owned by ${owner}`)

      // Verify license ownership first
      const verification = await this.verifyLicense(tokenId, owner)
      
      if (!verification.isValid || verification.owner !== owner) {
        throw new Error('License not owned by burner or invalid')
      }

      // Simulate burning process
      await new Promise(resolve => setTimeout(resolve, 1500))

      console.log(`License ${tokenId} burned successfully`)
      return true

    } catch (error) {
      console.error('License burning failed:', error)
      throw new Error(`Failed to burn license: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLicenseMetadata(tokenId: string): Promise<{
    name: string
    description: string
    image?: string
    attributes: Array<{
      trait_type: string
      value: string
    }>
  }> {
    try {
      console.log(`Getting metadata for license ${tokenId}`)

      // Simulate metadata retrieval
      await new Promise(resolve => setTimeout(resolve, 400))

      return {
        name: `Digital License #${tokenId.slice(-6)}`,
        description: 'NFT-based digital asset license with programmable permissions',
        image: 'https://ipfs.io/ipfs/QmLicenseImage',
        attributes: [
          {
            trait_type: 'License Type',
            value: 'Extended'
          },
          {
            trait_type: 'Duration',
            value: '365 days'
          },
          {
            trait_type: 'Max Uses',
            value: '5'
          },
          {
            trait_type: 'Commercial Use',
            value: 'Yes'
          }
        ]
      }

    } catch (error) {
      console.error('Failed to get license metadata:', error)
      throw new Error(`Failed to get license metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generateTokenId(): string {
    return Math.random().toString(16).substr(2, 16)
  }
}

// Singleton instance
export const pdpService = new PDPService()