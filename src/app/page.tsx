'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import AssetCard from '@/components/AssetCard'
import { Search, Filter, Star, Download, Eye } from 'lucide-react'

interface DigitalAsset {
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
}

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
}

export default function Home() {
  const [assets, setAssets] = useState<DigitalAsset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredAssets, setFeaturedAssets] = useState<DigitalAsset[]>([])
  const [trendingAssets, setTrendingAssets] = useState<DigitalAsset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    fileType: '',
    isFeatured: false,
    creator: ''
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
    fetchCategories()
    fetchFeaturedAssets()
    fetchTrendingAssets()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssets()
    }, 300) // Debounce API calls

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, sortBy, filters])

  const fetchFeaturedAssets = async () => {
    try {
      const response = await fetch('/api/assets?featured=true&limit=6')
      if (response.ok) {
        const data = await response.json()
        setFeaturedAssets(data.assets)
      }
    } catch (error) {
      console.error('Failed to fetch featured assets:', error)
    }
  }

  const fetchTrendingAssets = async () => {
    try {
      const response = await fetch('/api/assets?sortBy=trending&limit=8')
      if (response.ok) {
        const data = await response.json()
        setTrendingAssets(data.assets)
      }
    } catch (error) {
      console.error('Failed to fetch trending assets:', error)
    }
  }

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        sortBy,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        )
      })

      const response = await fetch(`/api/assets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Remove client-side filtering since we're doing server-side filtering
  // const filteredAssets = assets.filter(asset => {
  //   const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                        asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                        asset.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  //   const matchesCategory = selectedCategory === 'all' || asset.category?.name === selectedCategory
  //   return matchesSearch && matchesCategory
  // })

  // const sortedAssets = [...filteredAssets].sort((a, b) => {
  //   switch (sortBy) {
  //     case 'price-low':
  //       return a.price - b.price
  //     case 'price-high':
  //       return b.price - a.price
  //     case 'popular':
  //       return b.views - a.views
  //     case 'downloads':
  //       return b.downloads - a.downloads
  //     default:
  //       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //   }
  // })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10">
                <img
                  src="/logo.svg"
                  alt="Filecoin Marketplace"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold">Filecoin Digital Asset Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Discover & Trade Digital Assets on Filecoin</h2>
          <p className="text-xl mb-8">Secure, decentralized storage with blockchain-powered transactions</p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" variant="secondary" onClick={() => window.location.href = '#assets'}>Explore Assets</Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" onClick={() => window.location.href = '/upload'}>
              Start Selling
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Assets Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold mb-2">Featured Assets</h3>
              <p className="text-gray-600">Hand-picked digital assets from our top creators</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '#assets'}>
              View All Assets
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAssets.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={{...asset, isFeatured: true}}
                variant="featured"
              />
            ))}
          </div>

          {featuredAssets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No featured assets available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Assets Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold mb-2">Trending Now</h3>
              <p className="text-gray-600">Most popular assets this week</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                🔥 Hot
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingAssets.map((asset, index) => (
              <AssetCard 
                key={asset.id} 
                asset={asset}
                variant="trending"
                className="group"
              />
            ))}
          </div>

          {trendingAssets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No trending assets available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-6">Browse Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCategory(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    category.color ? `bg-${category.color}-100` : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">{category.icon || '📁'}</span>
                  </div>
                  <p className="font-medium text-sm">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            {/* Main Search Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search assets, tags, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                <div>
                  <Label className="text-sm font-medium">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">File Type</Label>
                  <Select value={filters.fileType} onValueChange={(value) => setFilters({ ...filters, fileType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="pdf">Documents</SelectItem>
                      <SelectItem value="model">3D Models</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Creator</Label>
                  <Input
                    placeholder="Search by creator..."
                    value={filters.creator}
                    onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-4">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={filters.isFeatured}
                    onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                  />
                  <Label htmlFor="featured">Featured assets only</Label>
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ minPrice: '', maxPrice: '', fileType: '', isFeatured: false, creator: '' })}
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => setShowAdvancedFilters(false)}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Assets Grid */}
      <section id="assets" className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Digital Assets</h3>
            <p className="text-gray-600">{assets.length} assets found</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map((asset) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset}
                />
              ))}
            </div>
          )}

          {assets.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No assets found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">Why Choose Our Marketplace?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold mb-2">Secure Storage</h4>
              <p className="text-gray-600 text-sm">Powered by Filecoin for decentralized, secure file storage</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <h4 className="font-semibold mb-2">Smart Payments</h4>
              <p className="text-gray-600 text-sm">Blockchain-powered transactions with escrow protection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📜</span>
              </div>
              <h4 className="font-semibold mb-2">Digital Licensing</h4>
              <p className="text-gray-600 text-sm">Smart contract-based licensing for digital products</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h4 className="font-semibold mb-2">Fast CDN</h4>
              <p className="text-gray-600 text-sm">Lightning-fast content delivery with IPFS integration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold">Filecoin Marketplace</span>
            </div>
            <div className="text-center md:text-right text-gray-600">
              <p>Built on Filecoin infrastructure</p>
              <p className="text-sm">© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}