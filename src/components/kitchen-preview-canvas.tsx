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
		img.crossOrigin = 'anonymous'
		img.onload = () => resolve(img)
		img.onerror = () => reject(new Error(`Failed to load ${src}`))
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

	const updateSurface = async (
		svg: SVGSVGElement,
		elementId: string | string[],
		opt: TextureOption | undefined,
		isFloor: boolean = false,
	) => {
		const ids = Array.isArray(elementId) ? elementId : [elementId]
		const elements = ids.map((id) => svg.querySelector(`#${id}`)).filter(Boolean) as SVGElement[]

		if (!opt) {
			return
		}
		
		if (elements.length === 0) {
			console.warn('No elements found for IDs:', ids)
			return
		}
		
		console.log(`Applying ${opt.type} to ${elements.length} element(s):`, ids)

		if (opt.type === 'color') {
			// Apply color directly - inline styles take precedence, so set style.fill directly
			let fillValue = opt.value
			
			// Add tile pattern for floors
			if (isFloor) {
				const patternId = createTilePattern(svg, opt.value)
				fillValue = `url(#${patternId})`
			}
			
			elements.forEach((el) => {
				// Clear any existing inline style first
				el.style.fill = ''
				el.style.stroke = ''
				// Set the new fill value
				el.setAttribute('fill', fillValue)
				// Also set style.fill to ensure it applies
				el.style.fill = fillValue
			})
		} else {
			// For texture images, create a pattern
			try {
				const texImg = await loadImage(getAssetUrl(opt.value))
				const patternId = `texture-${opt.id}`
				
				// Check if pattern already exists
				let pattern = svg.querySelector(`#${patternId}`) as SVGPatternElement
				if (!pattern) {
					let defs = svg.querySelector('defs')
					if (!defs) {
						defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
						svg.insertBefore(defs, svg.firstChild)
					}
					pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern')
					pattern.setAttribute('id', patternId)
					pattern.setAttribute('x', '0')
					pattern.setAttribute('y', '0')
					pattern.setAttribute('width', '100')
					pattern.setAttribute('height', '100')
					pattern.setAttribute('patternUnits', 'userSpaceOnUse')
					
					const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
					image.setAttribute('href', texImg.src)
					image.setAttribute('width', '100')
					image.setAttribute('height', '100')
					pattern.appendChild(image)
					defs.appendChild(pattern)
				}

				let fillValue = `url(#${patternId})`
				
				// Add tile pattern overlay for floors
				if (isFloor) {
					const tilePatternId = createTilePattern(svg, '#888')
					// Use a group with both patterns
					fillValue = `url(#${patternId})`
					// Note: We'll apply the tile pattern as an overlay using a mask or separate element
				}

				elements.forEach((el) => {
					el.setAttribute('fill', fillValue)
					// Directly set style.fill to override inline style
					el.style.fill = fillValue
				})
			} catch (error) {
				console.error('Failed to load texture:', error)
				// Fallback to gray if texture fails to load
				elements.forEach((el) => {
					el.setAttribute('fill', '#ccc')
					el.style.fill = '#ccc'
				})
			}
		}
	}

	const applyTextures = async (svg: SVGSVGElement) => {
		// Update background first
		await updateSurface(svg, ['background-surface'], selections.background)
		// Update each surface - apply backsplash first, then cabinets on top
		// Apply tile pattern to floor
		await updateSurface(svg, ['floor-surface', 'floor-surface-main'], selections.floor, true)
		// Countertop - all elements with #8d8975 color
		// Exclude fridge-door-surface and fridge-door-surface-2 (they're not countertops)
		// Exclude countertop-surface-3 (it's actually a cabinet door)
		await updateSurface(
			svg,
			[
				'countertop-surface-4',
				'countertop-surface-5',
				'countertop-surface-6',
				'countertop-surface-7',
				'countertop-surface-8',
				'countertop-surface-9',
				'countertop-surface-10',
				'countertop-surface-11',
				'countertop-surface-12',
				'countertop-surface-13',
				'countertop-surface-14',
				'countertop-surface-15',
				'countertop-surface-16',
				'countertop-surface-17',
				'countertop-surface-18',
				'countertop-surface-19',
				'countertop-surface-20',
				'countertop-surface-21',
			],
			selections.countertop,
		)
		// Apply backsplash to wall areas only (between upper cabinets and countertop)
		// Exclude backsplash-surface and backsplash-surface-2 as they overlap with upper cabinets
		await updateSurface(
			svg,
			[
				'backsplash-surface-wall-1',
				'backsplash-surface-wall-2',
				'backsplash-surface-wall-3',
			],
			selections.backsplash,
		)
		// Apply cabinets last (foreground layer) so they appear on top
		// Apply to both upper and lower cabinets together
		// All elements with #fff9d3 and #c9c5a7 colors
		await updateSurface(
			svg,
			[
				// Upper cabinets
				'cabinet-surface-upper-1',
				'cabinet-surface-upper-2',
				'cabinet-surface-upper-3',
				'cabinet-surface-upper-4',
				'cabinet-surface-upper-5',
				'cabinet-surface-upper-6',
				'cabinet-surface-upper-7',
				'cabinet-surface-upper-8',
				'cabinet-surface-upper-9',
				'cabinet-surface-upper-10',
				'cabinet-surface-upper-11',
				'cabinet-surface-upper-12',
				// Bottom/base cabinets
				'cabinet-surface-1',
				'cabinet-surface-2',
				'cabinet-surface-3',
				'cabinet-surface-4',
				'cabinet-surface-5',
				'cabinet-surface-6',
				'cabinet-surface-7',
				'cabinet-surface-8',
				'cabinet-surface-9',
				'cabinet-surface-10',
				'cabinet-surface-11',
				'cabinet-surface-12',
				'cabinet-surface-13',
				'cabinet-surface-14',
				'cabinet-surface-15',
				'cabinet-surface-16',
				'cabinet-surface-17',
				'cabinet-surface-18',
				'cabinet-surface-19',
				'cabinet-surface-20',
				'cabinet-surface-21',
				'cabinet-surface-22',
				'cabinet-surface-23',
				'cabinet-surface-24',
				'cabinet-surface-25',
				'cabinet-surface-26',
				'cabinet-surface-27',
				'cabinet-surface-28',
			],
			selections.cabinet,
		)
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
			return
		}

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
