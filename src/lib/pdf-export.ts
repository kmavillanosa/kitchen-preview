import { jsPDF } from 'jspdf'
import type { TextureOption, Theme } from '../types'
import { getAssetUrl } from './content'

interface ExportData {
	previewImage: string
	selections: {
		countertop: TextureOption | undefined
		backsplash: TextureOption | undefined
		cabinet: TextureOption | undefined
		floor: TextureOption | undefined
		background: TextureOption | undefined
	}
	selectedTheme: Theme | null
	sceneName: string
}

const isMobileViewport = (): boolean => {
	if (typeof window === 'undefined') return false
	return window.innerWidth < 768
}

export async function exportToPdf(data: ExportData): Promise<void> {
	const { previewImage, selections, selectedTheme, sceneName } = data
	const mobile = isMobileViewport()

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// Create PDF document (Letter size: 8.5 x 11 inches)
	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'in',
		format: 'letter',
	})

	const pageWidth = 8.5
	const pageHeight = 11
	const margin = mobile ? 0.6 : 0.5
	const contentWidth = pageWidth - 2 * margin
	let yPos = margin

	// Larger fonts on mobile for readability when viewing PDF on phone
	const titleSize = mobile ? 18 : 20
	const sectionSize = mobile ? 14 : 16
	const bodySize = mobile ? 11 : 10
	const smallSize = mobile ? 9 : 8
	const swatchSize = mobile ? 0.5 : 0.45
	const itemHeight = mobile ? 0.9 : 0.75
	const itemsPerRow = mobile ? 1 : 2
	const itemWidth = mobile ? contentWidth : (contentWidth - 0.25) / 2
	const itemSpacing = mobile ? 0.2 : 0.25
	const rowSpacing = mobile ? 0.3 : 0.25
	const maxImageHeight = mobile ? 3.5 : 4
	const swatchPadding = 0.1
	const textLeftMargin = 0.15

	// Helper function to add text
	const addText = (
		text: string,
		x: number,
		y: number,
		size: number,
		style: 'normal' | 'bold' = 'normal',
		color: [number, number, number] = [17, 24, 39],
	) => {
		pdf.setFontSize(size)
		pdf.setFont('helvetica', style)
		pdf.setTextColor(color[0], color[1], color[2])
		pdf.text(text, x, y)
	}

	// Helper function to draw a rectangle (for color swatches)
	const drawRect = (
		x: number,
		y: number,
		width: number,
		height: number,
		color: string,
	) => {
		const rgb = hexToRgb(color)
		if (rgb) {
			pdf.setFillColor(rgb.r, rgb.g, rgb.b)
			pdf.roundedRect(x, y, width, height, 0.03, 0.03, 'F')
			// Subtle border for better definition
			pdf.setDrawColor(Math.max(0, rgb.r - 30), Math.max(0, rgb.g - 30), Math.max(0, rgb.b - 30))
			pdf.setLineWidth(0.005)
			pdf.roundedRect(x, y, width, height, 0.03, 0.03, 'D')
		}
	}

	// Header
	addText('Kitchen Preview', margin, yPos, titleSize, 'bold')
	yPos += mobile ? 0.35 : 0.3
	addText(
		`Scene: ${sceneName} | ${formatDate(new Date())}`,
		margin,
		yPos,
		bodySize,
		'normal',
		[107, 114, 128],
	)
	yPos += mobile ? 0.45 : 0.4

	// Draw header line
	pdf.setDrawColor(229, 231, 235)
	pdf.line(margin, yPos, pageWidth - margin, yPos)
	yPos += 0.3

	// Preview section
	addText('Preview', margin, yPos, sectionSize, 'bold')
	yPos += mobile ? 0.3 : 0.25

	// Load and add preview image
	try {
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.src = previewImage

		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve()
			img.onerror = () => reject(new Error('Failed to load preview image'))
			setTimeout(() => reject(new Error('Image load timeout')), 5000)
		})

		// Calculate image dimensions to fit within content width
		const maxImageWidth = contentWidth
		const imgAspectRatio = img.width / img.height
		let imgWidth = maxImageWidth
		let imgHeight = imgWidth / imgAspectRatio

		if (imgHeight > maxImageHeight) {
			imgHeight = maxImageHeight
			imgWidth = imgHeight * imgAspectRatio
		}

		// Check if we need a new page
		if (yPos + imgHeight > pageHeight - margin - 1) {
			pdf.addPage()
			yPos = margin
		}

		pdf.addImage(previewImage, 'PNG', margin, yPos, imgWidth, imgHeight)
		yPos += imgHeight + 0.3
	} catch (error) {
		console.error('Error adding preview image:', error)
		addText('Preview image unavailable', margin, yPos, bodySize, 'normal', [
			156, 163, 175,
		])
		yPos += 0.3
	}

	// Textures section
	if (yPos > pageHeight - margin - 2) {
		pdf.addPage()
		yPos = margin
	}

	addText('Selected Textures', margin, yPos, sectionSize, 'bold')
	yPos += mobile ? 0.35 : 0.3

	// Theme badge
	if (selectedTheme) {
		const badgeWidth = mobile ? 2.8 : 2.5
		const badgeHeight = mobile ? 0.35 : 0.3
		pdf.setFillColor(239, 246, 255)
		pdf.roundedRect(margin, yPos - badgeHeight + 0.05, badgeWidth, badgeHeight, 0.06, 0.06, 'F')
		pdf.setDrawColor(191, 219, 254)
		pdf.setLineWidth(0.01)
		pdf.roundedRect(margin, yPos - badgeHeight + 0.05, badgeWidth, badgeHeight, 0.06, 0.06, 'D')
		addText(`Theme: ${selectedTheme.name}`, margin + 0.12, yPos - 0.05, bodySize, 'bold', [
			30, 64, 175,
		])
		yPos += mobile ? 0.55 : 0.45
	}

	// Texture items
	const textureItems = [
		{ label: 'Countertop', texture: selections.countertop },
		{ label: 'Backsplash', texture: selections.backsplash },
		{ label: 'Cabinet', texture: selections.cabinet },
		{ label: 'Floor', texture: selections.floor },
		{ label: 'Background', texture: selections.background },
	].filter((item) => item.texture)

	// Helper to load texture image and convert to data URI
	const loadTextureThumbnail = async (textureValue: string): Promise<string | null> => {
		return new Promise((resolve) => {
			try {
				const textureImg = new Image()
				textureImg.crossOrigin = 'anonymous'
				// Resolve the texture URL properly using getAssetUrl
				const textureUrl = getAssetUrl(textureValue)
				
				textureImg.onload = () => {
					try {
						const thumbCanvas = document.createElement('canvas')
						thumbCanvas.width = 100
						thumbCanvas.height = 100
						const thumbCtx = thumbCanvas.getContext('2d')
						if (thumbCtx) {
							thumbCtx.drawImage(textureImg, 0, 0, 100, 100)
							const thumbDataUrl = thumbCanvas.toDataURL('image/png')
							resolve(thumbDataUrl)
							return
						}
					} catch (error) {
						console.warn('[PDF Export] Failed to create texture thumbnail:', error)
					}
					resolve(null)
				}
				
				textureImg.onerror = () => {
					console.warn('[PDF Export] Failed to load texture image:', textureUrl)
					resolve(null)
				}
				
				textureImg.src = textureUrl
				
				// Timeout after 2 seconds
				setTimeout(() => {
					if (!textureImg.complete) {
						resolve(null)
					}
				}, 2000)
			} catch (error) {
				console.warn('[PDF Export] Error loading texture:', error)
				resolve(null)
			}
		})
	}

	for (let i = 0; i < textureItems.length; i++) {
		const item = textureItems[i]
		if (!item.texture) continue

		const col = i % itemsPerRow

		// Check if we need a new page before starting a new row
		if (col === 0 && yPos + itemHeight > pageHeight - margin - 0.5) {
			pdf.addPage()
			yPos = margin
		}

		const xPos = margin + col * (itemWidth + itemSpacing)
		const itemY = yPos

		// Draw background with subtle shadow effect
		pdf.setFillColor(255, 255, 255)
		pdf.roundedRect(xPos, itemY, itemWidth, itemHeight, 0.08, 0.08, 'F')

		// Draw border with better contrast
		pdf.setDrawColor(209, 213, 219)
		pdf.setLineWidth(0.01)
		pdf.roundedRect(xPos, itemY, itemWidth, itemHeight, 0.08, 0.08, 'D')

		// Calculate centered swatch position
		const swatchX = xPos + swatchPadding
		const swatchY = itemY + (itemHeight - swatchSize) / 2

		// Draw color swatch or texture image with border
		if (item.texture.type === 'color') {
			// Draw swatch with border
			drawRect(swatchX, swatchY, swatchSize, swatchSize, item.texture.value)
			// Add a subtle border around the swatch
			pdf.setDrawColor(200, 200, 200)
			pdf.setLineWidth(0.005)
			pdf.rect(swatchX, swatchY, swatchSize, swatchSize, 'D')
		} else if (item.texture.type === 'texture') {
			// For texture images, try to load and display a thumbnail
			const thumbDataUrl = await loadTextureThumbnail(item.texture.value)
			if (thumbDataUrl) {
				try {
					// Draw border around texture image
					pdf.setDrawColor(200, 200, 200)
					pdf.setLineWidth(0.005)
					pdf.rect(swatchX, swatchY, swatchSize, swatchSize, 'D')
					// Add the texture image
					pdf.addImage(thumbDataUrl, 'PNG', swatchX, swatchY, swatchSize, swatchSize)
				} catch (error) {
					console.warn('[PDF Export] Failed to add texture image to PDF:', error)
					// Fallback to gray rectangle
					drawRect(swatchX, swatchY, swatchSize, swatchSize, '#cccccc')
					pdf.setDrawColor(200, 200, 200)
					pdf.setLineWidth(0.005)
					pdf.rect(swatchX, swatchY, swatchSize, swatchSize, 'D')
				}
			} else {
				// Fallback to gray rectangle if image fails to load
				drawRect(swatchX, swatchY, swatchSize, swatchSize, '#cccccc')
				pdf.setDrawColor(200, 200, 200)
				pdf.setLineWidth(0.005)
				pdf.rect(swatchX, swatchY, swatchSize, swatchSize, 'D')
			}
		}

		// Calculate text position (centered vertically, aligned to swatch)
		const textX = xPos + swatchSize + swatchPadding + textLeftMargin
		const textCenterY = itemY + itemHeight / 2
		const textStartY = textCenterY - 0.12 // Offset to center text block

		// Category label (uppercase, smaller)
		addText(item.label.toUpperCase(), textX, textStartY, smallSize, 'normal', [
			107, 114, 128,
		])

		// Texture name (larger, bold)
		const textureNameY = textStartY + (mobile ? 0.2 : 0.18)
		addText(item.texture.label, textX, textureNameY, bodySize, 'bold')

		// Color value or texture indicator (smaller, below name)
		const valueY = textureNameY + (mobile ? 0.2 : 0.18)
		if (item.texture.type === 'color') {
			addText(item.texture.value, textX, valueY, smallSize, 'normal', [
				107, 114, 128,
			])
		} else if (item.texture.type === 'texture') {
			addText('Texture Image', textX, valueY, smallSize, 'normal', [
				107, 114, 128,
			])
		}

		// Update yPos after completing a row
		if (col === itemsPerRow - 1 || i === textureItems.length - 1) {
			yPos += itemHeight + rowSpacing
		}
	}

	// Footer
	yPos = pageHeight - margin - 0.3
	pdf.setDrawColor(229, 231, 235)
	pdf.line(margin, yPos, pageWidth - margin, yPos)
	yPos += 0.2
	pdf.setFontSize(mobile ? 10 : 9)
	pdf.setFont('helvetica', 'normal')
	pdf.setTextColor(156, 163, 175)
	pdf.text('Generated by Kitchen Preview Tool', pageWidth / 2, yPos, {
		align: 'center',
	})

	// Save PDF
	pdf.save(`kitchen-preview-${Date.now()}.pdf`)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null
}

/**
 * Convert an image URL to a data URI (base64)
 */
async function imageToDataUri(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = 'anonymous'
		
		img.onload = () => {
			try {
				const canvas = document.createElement('canvas')
				canvas.width = img.naturalWidth || img.width
				canvas.height = img.naturalHeight || img.height
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					reject(new Error('Could not get canvas context'))
					return
				}
				ctx.drawImage(img, 0, 0)
				const dataUri = canvas.toDataURL('image/png')
				resolve(dataUri)
			} catch (error) {
				reject(error)
			}
		}
		
		img.onerror = () => {
			reject(new Error(`Failed to load image: ${url}`))
		}
		
		img.src = url
	})
}

/**
 * Embed all external images in SVG patterns as data URIs
 */
async function embedSvgImages(svg: SVGSVGElement): Promise<void> {
	// Find all <image> elements in patterns
	const images = svg.querySelectorAll('pattern image, defs pattern image')
	const imagePromises: Promise<void>[] = []
	
	images.forEach((imgElement) => {
		const img = imgElement as SVGImageElement
		// Get href from either href or xlink:href attribute
		const href = img.getAttribute('href') || 
			img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
			img.getAttribute('xlink:href')
		
		if (href && !href.startsWith('data:')) {
			// Only process external URLs, not data URIs
			const promise = imageToDataUri(href)
				.then((dataUri) => {
					// Replace both href and xlink:href with data URI
					img.setAttribute('href', dataUri)
					img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUri)
					console.log(`[PDF Export] Embedded image: ${href.substring(0, 50)}...`)
				})
				.catch((error) => {
					console.warn(`[PDF Export] Failed to embed image ${href}:`, error)
					// Continue even if one image fails
				})
			imagePromises.push(promise)
		}
	})
	
	// Wait for all images to be embedded
	await Promise.all(imagePromises)
}

export async function captureSvgAsImage(
	svgElement: SVGSVGElement,
): Promise<string> {
	return new Promise(async (resolve, reject) => {
		try {
			const svgClone = svgElement.cloneNode(true) as SVGSVGElement
			
			// Get viewBox or calculate from dimensions
			let viewBox = svgElement.getAttribute('viewBox')
			let width = 1359
			let height = 877
			
			if (viewBox) {
				const parts = viewBox.split(' ')
				if (parts.length === 4) {
					width = parseFloat(parts[2]) || width
					height = parseFloat(parts[3]) || height
				}
			}
			// Always use viewBox / default dimensions for capture so PDF image is full resolution
			// even when SVG is displayed small on mobile
			
			// Set explicit dimensions for high-quality rendering
			svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`)
			svgClone.setAttribute('width', String(width))
			svgClone.setAttribute('height', String(height))
			svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
			svgClone.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink')
			svgClone.style.width = String(width) + 'px'
			svgClone.style.height = String(height) + 'px'

			// Embed all external images as data URIs before serializing
			console.log('[PDF Export] Embedding external images in SVG...')
			await embedSvgImages(svgClone)
			console.log('[PDF Export] Images embedded, serializing SVG...')

			const svgData = new XMLSerializer().serializeToString(svgClone)
			
			// Create blob URL with embedded images
			const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
			const url = URL.createObjectURL(svgBlob)

			const img = new Image()
			img.crossOrigin = 'anonymous'
			
			img.onload = () => {
				const canvas = document.createElement('canvas')
				// Use higher scale for better quality
				const scale = 3
				canvas.width = width * scale
				canvas.height = height * scale
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					reject(new Error('Could not get canvas context'))
					return
				}

				// High-quality rendering
				ctx.imageSmoothingEnabled = true
				ctx.imageSmoothingQuality = 'high'
				ctx.scale(scale, scale)
				
				// White background
				ctx.fillStyle = '#ffffff'
				ctx.fillRect(0, 0, width, height)
				
				// Draw the SVG
				ctx.drawImage(img, 0, 0, width, height)

				const dataUrl = canvas.toDataURL('image/png', 1.0)
				URL.revokeObjectURL(url)
				console.log('[PDF Export] SVG converted to image successfully')
				resolve(dataUrl)
			}
			
			img.onerror = (error) => {
				URL.revokeObjectURL(url)
				console.error('[PDF Export] Image load error:', error)
				reject(new Error('Failed to load SVG as image'))
			}
			
			img.src = url
		} catch (error) {
			console.error('[PDF Export] Error capturing SVG:', error)
			reject(error)
		}
	})
}

