'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, Star, ExternalLink } from 'lucide-react'
import { filCDN } from '@/lib/filcdn/filcdn-service'

interface AssetCardProps {
  asset: {
    id: string
    title: string
    description?: string
    price: number
    currency: string
    tags?: string
    views: number
    downloads: number
    cid?: string
    thumbnailCid?: string
    fileType?: string
    previewUrl?: string
    creator: {
      name?: string
      walletAddress?: string
    }
    category?: {
      name: string
      color?: string
    }
    isFeatured?: boolean
  }
  variant?: 'default' | 'featured' | 'trending' | 'compact'
  showCreator?: boolean
  showStats?: boolean
  className?: string
}

export default function AssetCard({
  asset,
  variant = 'default',
  showCreator = true,
  showStats = true,
  className = ''
}: AssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const generatePreview = async () => {
      if (!asset.cid && !asset.thumbnailCid) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const targetCid = asset.thumbnailCid || asset.cid
        
        if (targetCid) {
          // Generate optimized preview URL using FilCDN
          const previewOptions = {
            cid: targetCid,
            width: variant === 'compact' ? 200 : 400,
            height: variant === 'compact' ? 150 : 300,
            format: 'webp',
            quality: 80,
            fit: 'cover' as const
          }
          
          const url = await filCDN.generatePreviewUrl(previewOptions)
          setPreviewUrl(url)
        }
      } catch (error) {
        console.error('Failed to generate preview:', error)
        // Fallback to IPFS gateway
        if (asset.thumbnailCid) {
          setPreviewUrl(`https://ipfs.io/ipfs/${asset.thumbnailCid}`)
        } else if (asset.cid) {
          setPreviewUrl(`https://ipfs.io/ipfs/${asset.cid}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    generatePreview()
  }, [asset.cid, asset.thumbnailCid, variant])

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄'
    
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('model') || fileType.includes('3d')) return '🎮'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    
    return '📄'
  }

  const parseTags = (tagsString?: string): string[] => {
    if (!tagsString) return []
    try {
      return JSON.parse(tagsString)
    } catch {
      return tagsString.split(',').map(tag => tag.trim())
    }
  }

  const getCardHeight = () => {
    switch (variant) {
      case 'compact': return 'h-32'
      case 'trending': return 'h-40'
      case 'featured': return 'h-56'
      default: return 'h-48'
    }
  }

  const getCreatorDisplay = () => {
    if (asset.creator.name) return asset.creator.name
    if (asset.creator.walletAddress) {
      return `${asset.creator.walletAddress.slice(0, 6)}...${asset.creator.walletAddress.slice(-4)}`
    }
    return 'Anonymous'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className={`w-full ${getCardHeight()} bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center`}>
          <div className="animate-pulse text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm text-gray-500">Loading preview...</p>
          </div>
        </div>
      )
    }

    if (imageError || !previewUrl) {
      return (
        <div className={`w-full ${getCardHeight()} bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center`}>
          <div className="text-center">
            <div className="text-4xl mb-2">{getFileIcon(asset.fileType)}</div>
            <p className="text-xs text-gray-600">No preview available</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`relative w-full ${getCardHeight()} rounded-t-lg overflow-hidden group`}>
        <img
          src={previewUrl}
          alt={asset.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
        />
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {asset.isFeatured && (
            <Badge className="bg-yellow-500 text-white text-xs">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {variant === 'trending' && (
            <Badge className="bg-red-500 text-white text-xs">
              🔥 Trending
            </Badge>
          )}
        </div>
        
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            ${asset.price}
          </Badge>
        </div>

        {/* Quick action overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => window.location.href = `/asset/${asset.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${variant === 'featured' ? 'border-2 hover:border-blue-200' : ''} ${className}`}>
      {renderPreview()}
      
      <CardContent className={`p-${variant === 'compact' ? '2' : '4'}`}>
        <CardTitle className={`mb-1 line-clamp-1 ${variant === 'compact' ? 'text-sm' : variant === 'trending' ? 'text-sm' : 'text-lg'}`}>
          {asset.title}
        </CardTitle>
        
        {variant !== 'compact' && (
          <CardDescription className={`mb-3 line-clamp-${variant === 'trending' ? '1' : '2'}`}>
            {asset.description || 'No description available'}
          </CardDescription>
        )}

        {/* Tags */}
        {variant !== 'compact' && asset.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {parseTags(asset.tags).slice(0, variant === 'trending' ? 2 : 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Creator info */}
        {showCreator && (
          <div className={`mb-${variant === 'compact' ? '1' : '2'}`}>
            <span className={`text-${variant === 'compact' ? 'xs' : 'sm'} text-gray-600`}>
              by {getCreatorDisplay()}
            </span>
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className={`flex items-center gap-${variant === 'compact' ? '2' : '3'} text-${variant === 'compact' ? 'xs' : 'sm'} text-gray-500 mb-${variant === 'compact' ? '1' : '3'}`}>
            <div className="flex items-center gap-1">
              <Eye size={variant === 'compact' ? 12 : 14} />
              <span>{asset.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download size={variant === 'compact' ? 12 : 14} />
              <span>{asset.downloads}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-between">
          <span className={`font-semibold text-${variant === 'compact' ? 'sm' : 'base'}`}>
            ${asset.price}
          </span>
          <Button 
            size={variant === 'compact' ? 'sm' : 'default'} 
            onClick={() => window.location.href = `/asset/${asset.id}`}
          >
            {variant === 'compact' ? 'View' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}