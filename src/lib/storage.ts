import type { SavedDesign, KitchenSelections } from '../types'

const STORAGE_KEY = 'kitchen-preview-saved-designs'

export function getAllSavedDesigns(): SavedDesign[] {
	try {
		const data = localStorage.getItem(STORAGE_KEY)
		if (!data) return []
		const designs = JSON.parse(data) as SavedDesign[]
		return designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	} catch (error) {
		console.error('Failed to load saved designs:', error)
		return []
	}
}

export function getSavedDesign(id: string): SavedDesign | null {
	const designs = getAllSavedDesigns()
	return designs.find(d => d.id === id) || null
}

export function saveDesign(
	name: string,
	selections: KitchenSelections,
	sceneId: string,
	themeId: string | null,
	thumbnail?: string,
): SavedDesign {
	const designs = getAllSavedDesigns()
	const now = new Date().toISOString()
	
	const design: SavedDesign = {
		id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name,
		createdAt: now,
		updatedAt: now,
		selections,
		sceneId,
		themeId,
		thumbnail,
	}
	
	designs.push(design)
	localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
	return design
}

export function updateSavedDesign(
	id: string,
	updates: Partial<Pick<SavedDesign, 'name' | 'selections' | 'sceneId' | 'themeId' | 'thumbnail'>>,
): SavedDesign | null {
	const designs = getAllSavedDesigns()
	const index = designs.findIndex(d => d.id === id)
	
	if (index === -1) return null
	
	const design = designs[index]
	const updatedDesign: SavedDesign = {
		...design,
		...updates,
		updatedAt: new Date().toISOString(),
	}
	
	designs[index] = updatedDesign
	localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
	return updatedDesign
}

export function deleteSavedDesign(id: string): boolean {
	const designs = getAllSavedDesigns()
	const filtered = designs.filter(d => d.id !== id)
	
	if (filtered.length === designs.length) return false
	
	localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
	return true
}

export function generateThumbnail(svg: SVGSVGElement): Promise<string> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		if (!ctx) {
			reject(new Error('Could not get canvas context'))
			return
		}
		
		const svgData = new XMLSerializer().serializeToString(svg)
		const img = new Image()
		const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
		const url = URL.createObjectURL(svgBlob)
		
		img.onload = () => {
			canvas.width = 300
			canvas.height = 200
			ctx.drawImage(img, 0, 0, 300, 200)
			const dataUrl = canvas.toDataURL('image/png')
			URL.revokeObjectURL(url)
			resolve(dataUrl)
		}
		
		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error('Failed to generate thumbnail'))
		}
		
		img.src = url
	})
}
