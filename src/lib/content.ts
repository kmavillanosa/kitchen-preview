import type { Scene, TextureOption } from '../types'
import texturesBundled from '../data/textures.json'
import scenesBundled from '../data/scenes.json'

const baseUrl = import.meta.env.BASE_URL

export function getAssetUrl(path: string): string {
	if (path.startsWith('http')) return path
	return path.startsWith('/') ? `${baseUrl}${path.slice(1)}` : `${baseUrl}${path}`
}

function normalizeTextures(data: unknown): TextureOption[] {
	if (Array.isArray(data)) return data as TextureOption[]
	if (data && typeof data === 'object' && 'textures' in data) {
		return (data as { textures: TextureOption[] }).textures
	}
	return []
}

function normalizeScenes(data: unknown): Scene[] {
	if (Array.isArray(data)) return data as Scene[]
	if (data && typeof data === 'object' && 'scenes' in data) {
		return (data as { scenes: Scene[] }).scenes
	}
	return []
}

let cachedTextures: TextureOption[] | null = null
let cachedScenes: Scene[] | null = null

async function fetchJson<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(url)
		if (!res.ok) return null
		return (await res.json()) as T
	} catch {
		return null
	}
}

export async function loadTextures(): Promise<TextureOption[]> {
	if (cachedTextures) return cachedTextures
	const url = getAssetUrl('content/textures.json')
	const data = await fetchJson<unknown>(url)
	const list = data ? normalizeTextures(data) : normalizeTextures(texturesBundled)
	cachedTextures = list.sort((a, b) => a.order - b.order)
	return cachedTextures
}

export async function loadScenes(): Promise<Scene[]> {
	if (cachedScenes) return cachedScenes
	const url = getAssetUrl('content/scenes.json')
	const data = await fetchJson<unknown>(url)
	const list = data ? normalizeScenes(data) : normalizeScenes(scenesBundled)
	cachedScenes = list.sort((a, b) => a.order - b.order)
	return cachedScenes
}

export function getTextures(): TextureOption[] {
	if (cachedTextures) return cachedTextures
	const list = normalizeTextures(texturesBundled)
	return list.sort((a, b) => a.order - b.order)
}

export function getTexturesByCategory(
	category: TextureOption['category'],
): TextureOption[] {
	return getTextures().filter((t) => t.category === category)
}

export function getScenes(): Scene[] {
	if (cachedScenes) return cachedScenes
	return normalizeScenes(scenesBundled).sort((a, b) => a.order - b.order)
}

export function getDefaultScene(): Scene | undefined {
	const scenes = getScenes()
	return scenes.find((s) => s.isDefault) ?? scenes[0]
}
