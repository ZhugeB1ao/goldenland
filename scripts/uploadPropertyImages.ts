import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Service Role Key in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BUCKET_NAME = 'Properties'

// Download dummy images once to reuse them
const DUMMY_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
]

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  return await response.arrayBuffer()
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  console.log('Downloading dummy images into memory...')
  const imageBuffers: ArrayBuffer[] = []
  for (const url of DUMMY_IMAGE_URLS) {
    try {
      const buf = await downloadImage(url)
      imageBuffers.push(buf)
    } catch (e) {
      console.error('Failed to download dummy image', e)
    }
  }

  if (imageBuffers.length === 0) {
    console.error('No dummy images downloaded, exiting.')
    process.exit(1)
  }

  console.log('Fetching all properties...')
  const { docs: properties } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 10000,
    pagination: false,
  })

  console.log(`Found ${properties.length} properties. Starting upload and update process...`)

  let updatedCount = 0
  let failedCount = 0
  const failedPropertyIds: Array<string | number> = []

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    const propertyId = property.id
    
    // Generate a random number of images between 1 and 5
    const numImages = Math.floor(Math.random() * 5) + 1
    const newImagesArray = []

    console.log(`Processing Property ${i + 1}/${properties.length} (ID: ${propertyId}) - Uploading ${numImages} images`)

    for (let j = 0; j < numImages; j++) {
      const fileName = `${j + 1}.jpg`
      const filePath = `property-${propertyId}/${fileName}`
      
      // Use one of the cached image buffers (cycle through them)
      const buffer = imageBuffers[j % imageBuffers.length]

      try {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.error(`Error uploading ${filePath}:`, error.message)
        } else {
          // Construct the public URL
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)
            
          newImagesArray.push({
            image: publicUrlData.publicUrl,
            sort: j + 1
          })
        }
      } catch (err) {
        console.error(`Unexpected error uploading ${filePath}:`, err)
      }
    }

    // Ensure every property ends up with at least one image.
    if (newImagesArray.length === 0) {
      const fallbackPath = `property-${propertyId}/1.jpg`
      const fallbackBuffer = imageBuffers[0]

      try {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fallbackPath, fallbackBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.error(`Fallback upload failed for Property ${propertyId}:`, error.message)
        } else {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fallbackPath)

          newImagesArray.push({
            image: publicUrlData.publicUrl,
            sort: 1,
          })
        }
      } catch (err) {
        console.error(`Unexpected fallback upload error for Property ${propertyId}:`, err)
      }
    }

    // Update the property in Payload with the actual new image URLs
    if (newImagesArray.length > 0) {
      try {
        await payload.update({
          collection: 'properties',
          id: propertyId,
          data: {
            images: newImagesArray,
          },
        })
        updatedCount += 1
        console.log(`Updated Property ID: ${propertyId} with new image URLs.`)
      } catch (err) {
        failedCount += 1
        failedPropertyIds.push(propertyId)
        console.error(`Error updating property ${propertyId} in Payload:`, err)
      }
    } else {
      failedCount += 1
      failedPropertyIds.push(propertyId)
      console.error(`Property ${propertyId} still has no uploaded images after fallback attempt.`)
    }
  }

  const { docs: finalProperties } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 10000,
    pagination: false,
  })
  const withoutImages = finalProperties.filter((property) => !Array.isArray(property.images) || property.images.length === 0)

  console.log('--- Upload summary ---')
  console.log(`Total properties processed: ${properties.length}`)
  console.log(`Updated with images: ${updatedCount}`)
  console.log(`Failed to update: ${failedCount}`)
  console.log(`Properties without images after run: ${withoutImages.length}`)
  if (failedPropertyIds.length > 0) {
    console.log(`Failed property IDs: ${failedPropertyIds.join(', ')}`)
  }

  console.log('--- Upload and update complete ---')
  process.exit(0)
}

run()
