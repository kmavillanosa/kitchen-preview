import { jsPDF } from 'jspdf'
import type { TextureOption, Theme } from '../types'

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
	const swatchSize = mobile ? 0.35 : 0.3
	const itemHeight = mobile ? 0.75 : 0.6
	const itemsPerRow = mobile ? 1 : 2
	const itemWidth = mobile ? contentWidth : (contentWidth - 0.2) / 2
	const itemSpacing = mobile ? 0.15 : 0.2
	const rowSpacing = mobile ? 0.25 : 0.2
	const maxImageHeight = mobile ? 3.5 : 4

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
			pdf.rect(x, y, width, height, 'F')
			pdf.setDrawColor(200, 200, 200)
			pdf.rect(x, y, width, height, 'D')
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
	yPos += mobile ? 0.3 : 0.25

	// Theme badge
	if (selectedTheme) {
		pdf.setFillColor(239, 246, 255)
		pdf.roundedRect(margin, yPos - 0.15, mobile ? 2.5 : 2, mobile ? 0.3 : 0.25, 0.05, 0.05, 'F')
		addText(`Theme: ${selectedTheme.name}`, margin + 0.1, yPos, bodySize, 'bold', [
			30, 64, 175,
		])
		yPos += mobile ? 0.5 : 0.4
	}

	// Texture items
	const textureItems = [
		{ label: 'Countertop', texture: selections.countertop },
		{ label: 'Backsplash', texture: selections.backsplash },
		{ label: 'Cabinet', texture: selections.cabinet },
		{ label: 'Floor', texture: selections.floor },
		{ label: 'Background', texture: selections.background },
	].filter((item) => item.texture)

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

		// Draw background
		pdf.setFillColor(249, 250, 251)
		pdf.roundedRect(xPos, itemY, itemWidth, itemHeight, 0.05, 0.05, 'F')

		// Draw border
		pdf.setDrawColor(229, 231, 235)
		pdf.roundedRect(xPos, itemY, itemWidth, itemHeight, 0.05, 0.05, 'D')

		// Draw color swatch
		if (item.texture.type === 'color') {
			drawRect(xPos + 0.1, itemY + 0.1, swatchSize, swatchSize, item.texture.value)
		}

		// Add text labels (more spacing on mobile)
		const textX = xPos + swatchSize + (mobile ? 0.3 : 0.25)
		const textStartY = itemY + (mobile ? 0.18 : 0.15)

		// Category label (uppercase)
		addText(item.label.toUpperCase(), textX, textStartY, smallSize, 'normal', [
			107, 114, 128,
		])

		// Texture name
		addText(item.texture.label, textX, textStartY + (mobile ? 0.18 : 0.15), bodySize, 'bold')

		// Color value (if color type)
		if (item.texture.type === 'color') {
			addText(item.texture.value, textX, textStartY + (mobile ? 0.38 : 0.3), smallSize, 'normal', [
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

export async function captureSvgAsImage(
	svgElement: SVGSVGElement,
): Promise<string> {
	return new Promise((resolve, reject) => {
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
			svgClone.style.width = String(width) + 'px'
			svgClone.style.height = String(height) + 'px'

			const svgData = new XMLSerializer().serializeToString(svgClone)
			
			// For now, use SVG data directly (images will be embedded if they're in the SVG)
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
				resolve(dataUrl)
			}
			
			img.onerror = (error) => {
				URL.revokeObjectURL(url)
				console.error('Image load error:', error)
				reject(new Error('Failed to load SVG as image'))
			}
			
			img.src = url
		} catch (error) {
			reject(error)
		}
	})
}

