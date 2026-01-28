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

	const updateSurface = async (
		svg: SVGSVGElement,
		elementId: string | string[],
		opt: TextureOption | undefined,
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
			elements.forEach((el) => {
				el.setAttribute('fill', opt.value)
				// Directly set style.fill to override inline style attribute
				el.style.fill = opt.value
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

				elements.forEach((el) => {
					el.setAttribute('fill', `url(#${patternId})`)
					// Directly set style.fill to override inline style
					el.style.fill = `url(#${patternId})`
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
		await updateSurface(svg, ['floor-surface', 'floor-surface-main'], selections.floor)
		// Countertop on the three circled areas: left cabinet, main countertop, right cabinet
		await updateSurface(
			svg,
			['countertop-surface-2', 'countertop-surface', 'countertop-surface-3'],
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
				const viewBox = importedSvg.getAttribute('viewBox') || importedSvg.getAttribute('width') && importedSvg.getAttribute('height') 
					? `0 0 ${importedSvg.getAttribute('width')} ${importedSvg.getAttribute('height')}`
					: '0 0 1359 877'

				// Set viewBox and preserve aspect ratio for responsive scaling
				svg.setAttribute('viewBox', viewBox)
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

	const backgroundColor = selections.background?.value ?? '#f0f0f0'

	return (
		<div
			className="kitchen-preview-wrapper"
			style={{ backgroundColor }}
		>
			<svg
				ref={svgRef}
				className="kitchen-preview-canvas"
				aria-label="Kitchen preview with selected textures"
			/>
		</div>
	)
}
