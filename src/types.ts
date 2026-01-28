export type TextureCategory = 'countertop' | 'backsplash' | 'cabinet' | 'floor' | 'background'

export type TextureType = 'color' | 'texture'

export interface TextureOption {
	id: string
	label: string
	category: TextureCategory
	type: TextureType
	value: string
	order: number
}

export interface Scene {
	id: string
	name: string
	baseImageUrl: string
	maskCountertopUrl: string
	maskBacksplashUrl: string
	maskCabinetUrl: string
	maskFloorUrl: string
	isDefault: boolean
	order: number
}

export interface KitchenSelections {
	countertop: string
	backsplash: string
	cabinet: string
	floor: string
	background: string
}

export interface Theme {
	id: string
	name: string
	description?: string
	countertop: string
	backsplash: string
	cabinet: string
	floor: string
	background: string
	order: number
}
