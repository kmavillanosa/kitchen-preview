import { useEffect, useRef } from 'react'
import type { Scene, TextureOption } from '../types'
import { getAssetUrl } from '../lib/content'
import './kitchen-preview-canvas.css'

interface KitchenPreviewCanvasProps {
	scene: Scene
	selections: {
		countertop: TextureOption | undefined
		backsplash: TextureOption | undefined
		cabinet: TextureOption | undefined
		floor: TextureOption | undefined
		background: TextureOption | undefined
	}
	onSvgReady?: (svg: SVGSVGElement | null) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		// Only set crossOrigin if loading from a different origin
		// For same-origin images, this can cause CORS issues
		if (!src.startsWith(window.location.origin) && !src.startsWith('/')) {
			img.crossOrigin = 'anonymous'
		}
		img.onload = () => {
			console.log(`Image loaded successfully: ${src}`, {
				width: img.width,
				height: img.height,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight
			})
			resolve(img)
		}
		img.onerror = (e) => {
			console.error(`Failed to load image: ${src}`, e)
			reject(new Error(`Failed to load ${src}`))
		}
		img.src = src
	})
}

export function KitchenPreviewCanvas({
	scene,
	selections,
	onSvgReady,
}: KitchenPreviewCanvasProps) {
	const svgRef = useRef<SVGSVGElement>(null)
	const lastSelectionsRef = useRef<string>('')
	const svgLoadedRef = useRef(false)

	// Notify when SVG is ready (called from loadSvg and after texture updates)
	useEffect(() => {
		if (onSvgReady && svgRef.current && svgLoadedRef.current) {
			onSvgReady(svgRef.current)
		}
		return () => {
			if (onSvgReady) {
				onSvgReady(null)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onSvgReady])

	const createTilePattern = (svg: SVGSVGElement, baseColor: string): string => {
		const patternId = 'floor-tile-pattern'
		
		let defs = svg.querySelector('defs')
		if (!defs) {
			defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
			svg.insertBefore(defs, svg.firstChild)
		}

		// Remove existing pattern if it exists to force update
		const existingPattern = svg.querySelector(`#${patternId}`)
		if (existingPattern) {
			existingPattern.remove()
		}

		// Create new tile pattern with current color
		const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
		pattern.setAttribute('id', patternId)
		pattern.setAttribute('x', '0')
		pattern.setAttribute('y', '0')
		pattern.setAttribute('width', '40')
		pattern.setAttribute('height', '40')
		pattern.setAttribute('patternUnits', 'userSpaceOnUse')

		// Create tile background
		const tileRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		tileRect.setAttribute('width', '40')
		tileRect.setAttribute('height', '40')
		tileRect.setAttribute('fill', baseColor)
		pattern.appendChild(tileRect)

		// Create grout lines (darker lines between tiles)
		const groutColor = adjustColorBrightness(baseColor, -15)
		
		// Horizontal grout line
		const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
		hLine.setAttribute('x1', '0')
		hLine.setAttribute('y1', '40')
		hLine.setAttribute('x2', '40')
		hLine.setAttribute('y2', '40')
		hLine.setAttribute('stroke', groutColor)
		hLine.setAttribute('stroke-width', '1')
		pattern.appendChild(hLine)

		// Vertical grout line
		const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
		vLine.setAttribute('x1', '40')
		vLine.setAttribute('y1', '0')
		vLine.setAttribute('x2', '40')
		vLine.setAttribute('y2', '40')
		vLine.setAttribute('stroke', groutColor)
		vLine.setAttribute('stroke-width', '1')
		pattern.appendChild(vLine)

		defs.appendChild(pattern)
		return patternId
	}

	const adjustColorBrightness = (color: string, percent: number): string => {
		// Convert hex to RGB
		const hex = color.replace('#', '')
		const r = parseInt(hex.substring(0, 2), 16)
		const g = parseInt(hex.substring(2, 4), 16)
		const b = parseInt(hex.substring(4, 6), 16)

		// Calculate luminance to determine if color is light or dark
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
		
		// Adjust brightness - darker for light colors, lighter for dark colors
		const factor = percent / 100
		let newR = Math.max(0, Math.min(255, Math.round(r * (1 - Math.abs(factor)))))
		let newG = Math.max(0, Math.min(255, Math.round(g * (1 - Math.abs(factor)))))
		let newB = Math.max(0, Math.min(255, Math.round(b * (1 - Math.abs(factor)))))

		// Ensure grout is always darker
		if (luminance > 0.5) {
			// Light color - make grout darker
			newR = Math.max(0, Math.min(255, Math.round(r * 0.7)))
			newG = Math.max(0, Math.min(255, Math.round(g * 0.7)))
			newB = Math.max(0, Math.min(255, Math.round(b * 0.7)))
		} else {
			// Dark color - make grout slightly darker
			newR = Math.max(0, Math.min(255, Math.round(r * 0.85)))
			newG = Math.max(0, Math.min(255, Math.round(g * 0.85)))
			newB = Math.max(0, Math.min(255, Math.round(b * 0.85)))
		}

		// Convert back to hex
		return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
	}

	// Convert RGB/RGBA to hex
	const rgbToHex = (rgb: string): string => {
		const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i)
		if (rgbMatch) {
			const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
			const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
			const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
			return `#${r}${g}${b}`
		}
		return ''
	}

	// Get the actual fill color of an element (checking all sources)
	const getElementFillColor = (element: SVGElement): string => {
		// 1. Check fill attribute
		const fillAttr = element.getAttribute('fill') || ''
		if (fillAttr && fillAttr.startsWith('#')) {
			return fillAttr.toLowerCase().trim()
		}
		
		// 2. Check style attribute
		const styleAttr = element.getAttribute('style') || ''
		if (styleAttr) {
			// Check for fill:#color or fill: #color
			const fillMatch = styleAttr.match(/fill:\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\))/i)
			if (fillMatch) {
				const fillValue = fillMatch[1].trim().toLowerCase()
				if (fillValue.startsWith('#')) {
					return fillValue
				} else if (fillValue.startsWith('rgb')) {
					return rgbToHex(fillValue)
				}
			}
		}
		
		// 3. Check computed style (actual rendered color)
		try {
			const computed = window.getComputedStyle(element)
			const computedFill = computed.fill.trim()
			if (computedFill && computedFill !== 'none' && computedFill !== 'rgb(0, 0, 0)') {
				if (computedFill.startsWith('#')) {
					return computedFill.toLowerCase()
				} else if (computedFill.startsWith('rgb')) {
					return rgbToHex(computedFill)
				}
			}
		} catch (e) {
			// Ignore errors
		}
		
		// 4. Check parent element's fill (inherited)
		const parent = element.parentElement
		if (parent && parent instanceof SVGElement) {
			const parentFill = getElementFillColor(parent)
			if (parentFill) {
				return parentFill
			}
		}
		
		return ''
	}

	// Helper function to find elements by fill color
	const findElementsByColor = (svg: SVGSVGElement, colors: string[]): SVGElement[] => {
		const allPaths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[]
		const normalizedColors = colors.map(c => {
			const color = c.toLowerCase().trim()
			// Normalize: ensure it starts with #
			return color.startsWith('#') ? color : `#${color}`
		})
		
		const foundElements: SVGElement[] = []
		const colorMap = new Map<string, SVGElement[]>() // Track which colors map to which elements
		
		allPaths.forEach((path) => {
			const actualColor = getElementFillColor(path)
			
			if (actualColor) {
				// Check if this color matches any of our target colors
				const matches = normalizedColors.some(targetColor => {
					return actualColor === targetColor
				})
				
				if (matches) {
					foundElements.push(path)
					// Track for debugging
					if (!colorMap.has(actualColor)) {
						colorMap.set(actualColor, [])
					}
					colorMap.get(actualColor)!.push(path)
				}
			}
		})
		
		// Log found colors for debugging
		if (foundElements.length > 0) {
			console.log(`Found ${foundElements.length} elements with target colors:`, normalizedColors)
			console.log('Actual colors found:', Array.from(colorMap.keys()))
		} else {
			console.warn(`No elements found with colors:`, normalizedColors)
		}
		
		return foundElements
	}

	// Helper to extract all unique colors from SVG (for debugging)
	const getAllColors = (svg: SVGSVGElement): string[] => {
		const allPaths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[]
		const colors = new Set<string>()
		
		allPaths.forEach((path) => {
			const actualColor = getElementFillColor(path)
			if (actualColor) {
				colors.add(actualColor)
			}
		})
		
		return Array.from(colors).sort()
	}

	// Get element selectors based on scene ID
	const getSceneSelectors = (sceneId: string, svg: SVGSVGElement) => {
		if (sceneId === 'kitchen-preview-2') {
			// Log all colors for debugging (only once)
			if (!(window as any).__kitchenPreview2ColorsLogged) {
				const allColors = getAllColors(svg)
				console.log('All colors found in kitchen-preview-2.svg:', allColors)
				
				// Also log color frequency to help identify which colors are most common
				const colorFrequency = new Map<string, number>()
				const allPaths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[]
				allPaths.forEach((path) => {
					const color = getElementFillColor(path)
					if (color) {
						colorFrequency.set(color, (colorFrequency.get(color) || 0) + 1)
					}
				})
				const sortedColors = Array.from(colorFrequency.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 20) // Top 20 most common colors
				console.log('Most common colors:', sortedColors)
				
				;(window as any).__kitchenPreview2ColorsLogged = true
			}
			
			// For kitchen-preview-2, use color-based selection
			// Try multiple color variations to match elements
			return {
				background: () => {
					// Background is typically the largest area - try common background colors
					return findElementsByColor(svg, ['#BDBCC0', '#bdbcc0', '#BDBCB0', '#bdbc0'])
				},
				floor: () => {
					// Floor colors - try common floor/tile colors
					return findElementsByColor(svg, [
						'#737373', '#615739', '#737373', '#615739',
						'#6B6B6B', '#5A5A5A', '#4A4A4A', '#3A3A3A'
					])
				},
				countertop: () => {
					// Countertops: try #8d8975 and similar brownish/grayish colors
					return findElementsByColor(svg, [
						'#8d8975', '#8D8975', '#8D8A75', '#8E8975',
						'#9D9975', '#7D7975', '#8C8874', '#8E8A76'
					])
				},
				backsplash: () => {
					// Backsplash walls - try light colors that might be walls
					// Exclude cabinet colors and background
					const cabinetColors = ['#fff9d3', '#c9c5a7', '#fffad3', '#fff8d3', '#c9c6a7', '#c8c5a7', '#d9d5b7', '#e9e5c7']
					const backgroundColors = ['#bdbcc0', '#bdbc0']
					const allPaths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[]
					const backsplashElements: SVGElement[] = []
					
					allPaths.forEach((path) => {
						const actualColor = getElementFillColor(path)
						
						if (actualColor) {
							// Light colors (starting with f, e, or d) that aren't cabinets or background
							const isLightColor = actualColor.startsWith('#f') || 
								actualColor.startsWith('#e') || 
								actualColor.startsWith('#d')
							const isNotCabinet = !cabinetColors.some(c => actualColor === c.toLowerCase())
							const isNotBackground = !backgroundColors.some(c => actualColor === c.toLowerCase())
							
							if (isLightColor && isNotCabinet && isNotBackground) {
								backsplashElements.push(path)
							}
						}
					})
					
					console.log(`Found ${backsplashElements.length} backsplash elements`)
					return backsplashElements
				},
				cabinet: () => {
					// Cabinets: #fff9d3 and #c9c5a7 and variations
					return findElementsByColor(svg, [
						'#fff9d3', '#FFF9D3', '#FFFAD3', '#FFF8D3',
						'#c9c5a7', '#C9C5A7', '#C9C6A7', '#C8C5A7',
						'#D9D5B7', '#E9E5C7'
					])
				},
			}
		}
		
		// Default: kitchen-preview (ID-based)
		return {
			background: () => {
				const el = svg.querySelector('#background-surface') as SVGElement | null
				return el ? [el] : []
			},
			floor: () => {
				const els = [
					svg.querySelector('#floor-surface') as SVGElement | null,
					svg.querySelector('#floor-surface-main') as SVGElement | null,
				].filter(Boolean) as SVGElement[]
				return els
			},
			countertop: () => {
				const ids = [
					'countertop-surface-4', 'countertop-surface-5', 'countertop-surface-6',
					'countertop-surface-7', 'countertop-surface-8', 'countertop-surface-9',
					'countertop-surface-10', 'countertop-surface-11', 'countertop-surface-12',
					'countertop-surface-13', 'countertop-surface-14', 'countertop-surface-15',
					'countertop-surface-16', 'countertop-surface-17', 'countertop-surface-18',
					'countertop-surface-19', 'countertop-surface-20', 'countertop-surface-21',
				]
				return ids.map(id => svg.querySelector(`#${id}`) as SVGElement | null).filter(Boolean) as SVGElement[]
			},
			backsplash: () => {
				const ids = [
					'backsplash-surface-wall-1',
					'backsplash-surface-wall-2',
					'backsplash-surface-wall-3',
				]
				return ids.map(id => svg.querySelector(`#${id}`) as SVGElement | null).filter(Boolean) as SVGElement[]
			},
			cabinet: () => {
				const ids = [
					'cabinet-surface-upper-1', 'cabinet-surface-upper-2', 'cabinet-surface-upper-3',
					'cabinet-surface-upper-4', 'cabinet-surface-upper-5', 'cabinet-surface-upper-6',
					'cabinet-surface-upper-7', 'cabinet-surface-upper-8', 'cabinet-surface-upper-9',
					'cabinet-surface-upper-10', 'cabinet-surface-upper-11', 'cabinet-surface-upper-12',
					'cabinet-surface-1', 'cabinet-surface-2', 'cabinet-surface-3',
					'cabinet-surface-4', 'cabinet-surface-5', 'cabinet-surface-6',
					'cabinet-surface-7', 'cabinet-surface-8', 'cabinet-surface-9',
					'cabinet-surface-10', 'cabinet-surface-11', 'cabinet-surface-12',
					'cabinet-surface-13', 'cabinet-surface-14', 'cabinet-surface-15',
					'cabinet-surface-16', 'cabinet-surface-17', 'cabinet-surface-18',
					'cabinet-surface-19', 'cabinet-surface-20', 'cabinet-surface-21',
					'cabinet-surface-22', 'cabinet-surface-23', 'cabinet-surface-24',
					'cabinet-surface-25', 'cabinet-surface-26', 'cabinet-surface-27',
					'cabinet-surface-28',
				]
				return ids.map(id => svg.querySelector(`#${id}`) as SVGElement | null).filter(Boolean) as SVGElement[]
			},
		}
	}

	const updateSurface = async (
		svg: SVGSVGElement,
		elementId: string | string[] | (() => SVGElement[]),
		opt: TextureOption | undefined,
		isFloor: boolean = false,
	) => {
		// Handle function-based selectors (for scene-aware selection)
		let elements: SVGElement[] = []
		if (typeof elementId === 'function') {
			elements = elementId()
		} else {
			const ids = Array.isArray(elementId) ? elementId : [elementId]
			elements = ids.map((id) => svg.querySelector(`#${id}`)).filter(Boolean) as SVGElement[]
		}

		if (!opt) {
			console.warn('[updateSurface] No texture option provided')
			return
		}
		
		if (elements.length === 0) {
			const selectorInfo = typeof elementId === 'function' ? 'color-based' : elementId
			console.warn('[updateSurface] No elements found for selector:', selectorInfo)
			return
		}
		
		const selectorInfo = typeof elementId === 'function' ? 'color-based' : elementId
		
		// Verify texture option has required properties
		if (!opt.type) {
			console.error('[updateSurface] Texture option missing type:', opt)
			return
		}
		
		console.log(`[updateSurface] Applying ${opt.type} texture (id: ${opt.id}) to ${elements.length} element(s):`, {
			selector: selectorInfo,
			type: opt.type,
			value: opt.value,
			category: opt.category,
			isFloor,
			textureOption: opt,
			isColor: opt.type === 'color',
			isTexture: opt.type === 'texture'
		})

		if (opt.type === 'color') {
			// Apply color directly - inline styles take precedence, so set style.fill directly
			let fillValue = opt.value
			
			// Add tile pattern for floors
			if (isFloor) {
				const patternId = createTilePattern(svg, opt.value)
				fillValue = `url(#${patternId})`
			}
			
			elements.forEach((el) => {
				// Remove fill attribute to clear any existing value
				el.removeAttribute('fill')
				
				// Clear any existing inline style
				el.style.fill = ''
				el.style.stroke = ''
				
				// Remove fill from style attribute if present
				const styleAttr = el.getAttribute('style') || ''
				if (styleAttr) {
					const newStyle = styleAttr
						.replace(/fill:\s*[^;]+;?/gi, '')
						.replace(/fill:\s*[^;]+/gi, '')
						.trim()
					if (newStyle) {
						el.setAttribute('style', newStyle)
					} else {
						el.removeAttribute('style')
					}
				}
				
				// Set the new fill value using both attribute and style for maximum compatibility
				el.setAttribute('fill', fillValue)
				el.style.fill = fillValue
			})
		} else if (opt.type === 'texture') {
			// For texture images, create a pattern
			try {
				const textureUrl = getAssetUrl(opt.value)
				console.log(`[TEXTURE] Loading texture image for ${opt.id}:`, {
					textureUrl,
					originalValue: opt.value,
					category: opt.category
				})
				
				const texImg = await loadImage(textureUrl)
				console.log(`[TEXTURE] Image loaded successfully:`, {
					src: texImg.src,
					width: texImg.width,
					height: texImg.height,
					naturalWidth: texImg.naturalWidth,
					naturalHeight: texImg.naturalHeight
				})
				
				const patternId = `texture-${opt.id}`
				
				let defs = svg.querySelector('defs')
				if (!defs) {
					defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
					svg.insertBefore(defs, svg.firstChild)
				}
				
				// Remove existing pattern if it exists to force update
				const existingPattern = svg.querySelector(`#${patternId}`)
				if (existingPattern) {
					console.log(`[TEXTURE] Removing existing pattern: ${patternId}`)
					existingPattern.remove()
				}
				
				// Get actual image dimensions
				const imgWidth = texImg.naturalWidth || texImg.width || 200
				const imgHeight = texImg.naturalHeight || texImg.height || 200
				
				// Use image dimensions for pattern, but ensure reasonable tiling
				// Pattern units are in user space, so use actual pixel dimensions
				const patternWidth = imgWidth
				const patternHeight = imgHeight
				
				console.log(`[TEXTURE] Creating pattern with dimensions: ${patternWidth}x${patternHeight}`, {
					imgWidth,
					imgHeight,
					naturalWidth: texImg.naturalWidth,
					naturalHeight: texImg.naturalHeight
				})
				
				// Create new pattern with image dimensions
				const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
				pattern.setAttribute('id', patternId)
				pattern.setAttribute('x', '0')
				pattern.setAttribute('y', '0')
				pattern.setAttribute('width', String(patternWidth))
				pattern.setAttribute('height', String(patternHeight))
				pattern.setAttribute('patternUnits', 'userSpaceOnUse')
				pattern.setAttribute('patternContentUnits', 'userSpaceOnUse')
				
				const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
				// Use xlink:href for better compatibility (required in some browsers)
				image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', texImg.src)
				// Also set href for SVG 2.0 compatibility
				image.setAttribute('href', texImg.src)
				image.setAttribute('x', '0')
				image.setAttribute('y', '0')
				image.setAttribute('width', String(patternWidth))
				image.setAttribute('height', String(patternHeight))
				image.setAttribute('preserveAspectRatio', 'none')
				pattern.appendChild(image)
				defs.appendChild(pattern)
				
				console.log(`[TEXTURE] Pattern created: ${patternId}`, {
					patternElement: pattern,
					defsElement: defs,
					imageElement: image,
					imageSrc: texImg.src
				})

				const fillValue = `url(#${patternId})`
				console.log(`[TEXTURE] Applying fill: ${fillValue} to ${elements.length} elements`)

				elements.forEach((el, index) => {
					// Remove fill attribute to clear any existing value
					el.removeAttribute('fill')
					
					// Clear any existing inline style
					el.style.fill = ''
					el.style.stroke = ''
					
					// Remove fill from style attribute if present
					const styleAttr = el.getAttribute('style') || ''
					if (styleAttr) {
						const newStyle = styleAttr
							.replace(/fill:\s*[^;]+;?/gi, '')
							.replace(/fill:\s*[^;]+/gi, '')
							.trim()
						if (newStyle) {
							el.setAttribute('style', newStyle)
						} else {
							el.removeAttribute('style')
						}
					}
					
					// Set the new fill value using both attribute and style for maximum compatibility
					el.setAttribute('fill', fillValue)
					el.style.fill = fillValue
					
					if (index === 0) {
						console.log(`[TEXTURE] Applied to first element:`, {
							element: el,
							fillAttr: el.getAttribute('fill'),
							fillStyle: el.style.fill,
							computedFill: window.getComputedStyle(el).fill
						})
					}
				})
				
				// Verify pattern exists in SVG
				const verifyPattern = svg.querySelector(`#${patternId}`)
				console.log(`[TEXTURE] Pattern verification:`, {
					patternId,
					exists: !!verifyPattern,
					pattern: verifyPattern
				})
				
				console.log(`[TEXTURE] Successfully applied texture pattern ${patternId} to ${elements.length} element(s)`)
			} catch (error) {
				console.error('[TEXTURE] Failed to load texture:', error, {
					textureId: opt.id,
					textureValue: opt.value,
					textureUrl: getAssetUrl(opt.value),
					errorMessage: error instanceof Error ? error.message : String(error)
				})
				// Fallback to gray if texture fails to load
				elements.forEach((el) => {
					el.setAttribute('fill', '#ccc')
					el.style.fill = '#ccc'
				})
			}
		} else {
			console.warn(`[TEXTURE] Unknown texture type: ${opt.type}`, opt)
		}
	}

	const applyTextures = async (svg: SVGSVGElement) => {
		// Get scene-specific selectors
		const selectors = getSceneSelectors(scene.id, svg)
		
		// Update background first
		await updateSurface(svg, selectors.background, selections.background)
		
		// Apply tile pattern to floor
		await updateSurface(svg, selectors.floor, selections.floor, true)
		
		// Countertop - all elements with #8d8975 color (or ID-based for kitchen-preview)
		await updateSurface(svg, selectors.countertop, selections.countertop)
		
		// Apply backsplash to wall areas only (between upper cabinets and countertop)
		await updateSurface(svg, selectors.backsplash, selections.backsplash)
		
		// Apply cabinets last (foreground layer) so they appear on top
		// Apply to both upper and lower cabinets together
		await updateSurface(svg, selectors.cabinet, selections.cabinet)
	}

	useEffect(() => {
		// Load the SVG
		const svg = svgRef.current
		if (!svg) return

		const loadSvg = async () => {
			try {
				const response = await fetch(getAssetUrl(scene.baseImageUrl))
				const svgText = await response.text()
				const parser = new DOMParser()
				const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
				const importedSvg = svgDoc.documentElement

				// Get original dimensions and viewBox
				const originalViewBox = importedSvg.getAttribute('viewBox') || (importedSvg.getAttribute('width') && importedSvg.getAttribute('height') 
					? `0 0 ${importedSvg.getAttribute('width')} ${importedSvg.getAttribute('height')}`
					: '0 0 1359 877')
				
				// Parse viewBox to zoom out (add padding around the content)
				const viewBoxMatch = originalViewBox.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
				if (viewBoxMatch) {
					const [, x, y, width, height] = viewBoxMatch.map(Number)
					// Add 15% padding on all sides to zoom out
					const paddingX = width * 0.15
					const paddingY = height * 0.15
					const newViewBox = `${x - paddingX} ${y - paddingY} ${width + paddingX * 2} ${height + paddingY * 2}`
					svg.setAttribute('viewBox', newViewBox)
				} else {
					svg.setAttribute('viewBox', originalViewBox)
				}
				
				// Set preserve aspect ratio for responsive scaling
				svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
				svg.removeAttribute('width')
				svg.removeAttribute('height')

				// Clear and copy content
				svg.innerHTML = importedSvg.innerHTML
				svgLoadedRef.current = true

				// Apply textures after SVG is loaded
				await applyTextures(svg)
				
				// Notify that SVG is ready
				if (onSvgReady) {
					onSvgReady(svg)
				}
			} catch (error) {
				console.error('Failed to load SVG:', error)
			}
		}

		loadSvg()
	}, [scene.baseImageUrl])

	useEffect(() => {
		const svg = svgRef.current
		if (!svg || !svgLoadedRef.current) return

		// Log current selections for debugging
		console.log('[KitchenPreviewCanvas] Selections changed:', {
			countertop: selections.countertop ? { id: selections.countertop.id, type: selections.countertop.type, value: selections.countertop.value } : null,
			backsplash: selections.backsplash ? { id: selections.backsplash.id, type: selections.backsplash.type, value: selections.backsplash.value } : null,
			cabinet: selections.cabinet ? { id: selections.cabinet.id, type: selections.cabinet.type, value: selections.cabinet.value } : null,
			floor: selections.floor ? { id: selections.floor.id, type: selections.floor.type, value: selections.floor.value } : null,
			background: selections.background ? { id: selections.background.id, type: selections.background.type, value: selections.background.value } : null,
		})

		// Create a key from selections to detect changes
		const selectionsKey = JSON.stringify({
			sceneId: scene.id,
			countertop: selections.countertop?.id,
			backsplash: selections.backsplash?.id,
			cabinet: selections.cabinet?.id,
			floor: selections.floor?.id,
			background: selections.background?.id,
		})

		// Skip if selections haven't changed
		if (lastSelectionsRef.current === selectionsKey) {
			console.log('[KitchenPreviewCanvas] Selections unchanged, skipping update')
			return
		}

		console.log('[KitchenPreviewCanvas] Applying textures with new selections')
		lastSelectionsRef.current = selectionsKey
		applyTextures(svg).then(() => {
			// Notify that SVG is ready after textures are applied
			if (onSvgReady && svg) {
				onSvgReady(svg)
			}
		})
	}, [scene.id, selections.countertop?.id, selections.backsplash?.id, selections.cabinet?.id, selections.floor?.id, selections.background?.id, onSvgReady])

	const backgroundColor = selections.background?.value ?? '#f8fafc'
	
	// Calculate grid line color based on background brightness
	const getGridColor = (bgColor: string): string => {
		const hex = bgColor.replace('#', '')
		const r = parseInt(hex.substring(0, 2), 16)
		const g = parseInt(hex.substring(2, 4), 16)
		const b = parseInt(hex.substring(4, 6), 16)
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
		
		// Use darker grid for light backgrounds, lighter for dark backgrounds
		return luminance > 0.5 
			? 'rgba(0, 0, 0, 0.06)' 
			: 'rgba(255, 255, 255, 0.1)'
	}
	
	const gridColor = getGridColor(backgroundColor)

	return (
		<div
			className="kitchen-preview-wrapper"
			style={{ 
				backgroundColor,
				backgroundImage: `
					linear-gradient(${gridColor} 1px, transparent 1px),
					linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
				`
			}}
		>
			<svg
				ref={svgRef}
				className="kitchen-preview-canvas"
				aria-label="Kitchen preview with selected textures"
			/>
		</div>
	)
}
