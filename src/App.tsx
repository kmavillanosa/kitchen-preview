import { useMemo, useState, useEffect } from 'react'
import {
	getTexturesByCategory,
	getDefaultScene,
	getTextures,
	loadTextures,
	loadScenes,
} from './lib/content'
import { TextureSelector } from './components/texture-selector'
import { KitchenPreviewCanvas } from './components/kitchen-preview-canvas'
import type { KitchenSelections, TextureOption } from './types'
import './App.css'

function getDefaultSelections(): KitchenSelections {
	const countertops = getTexturesByCategory('countertop')
	const backsplash = getTexturesByCategory('backsplash')
	const cabinet = getTexturesByCategory('cabinet')
	const floor = getTexturesByCategory('floor')
	return {
		countertop: countertops[0]?.id ?? '',
		backsplash: backsplash[0]?.id ?? '',
		cabinet: cabinet[0]?.id ?? '',
		floor: floor[0]?.id ?? '',
	}
}

function App() {
	const [contentReady, setContentReady] = useState(false)
	useEffect(() => {
		Promise.all([loadTextures(), loadScenes()]).then(() =>
			setContentReady(true),
		)
	}, [])

	const scene = useMemo(() => getDefaultScene(), [contentReady])
	const [selections, setSelections] = useState<KitchenSelections>(
		getDefaultSelections,
	)

	const textureMap = useMemo(() => {
		const list = getTextures()
		return new Map<string, TextureOption>(list.map((t) => [t.id, t]))
	}, [])

	const selectionOptions = useMemo(
		() => ({
			countertop: textureMap.get(selections.countertop),
			backsplash: textureMap.get(selections.backsplash),
			cabinet: textureMap.get(selections.cabinet),
			floor: textureMap.get(selections.floor),
		}),
		[selections, textureMap],
	)

	const handleSelect =
		(category: keyof KitchenSelections) => (id: string) => {
			setSelections((prev) => ({ ...prev, [category]: id }))
		}

	if (!scene) {
		return (
			<div className="app app--error">
				<p>No kitchen scene configured. Add scenes in the CMS.</p>
			</div>
		)
	}

	return (
		<div className="app">
			<header className="app__header">
				<h1 className="app__title">Kitchen Preview</h1>
				<a href="/kitchen-preview/admin/" className="app__admin-link">
					Admin
				</a>
			</header>
			<main className="app__main">
				<aside className="app__sidebar">
					<TextureSelector
						title="Countertop"
						options={getTexturesByCategory('countertop')}
						selectedId={selections.countertop}
						onSelect={handleSelect('countertop')}
					/>
					<TextureSelector
						title="Backsplash"
						options={getTexturesByCategory('backsplash')}
						selectedId={selections.backsplash}
						onSelect={handleSelect('backsplash')}
					/>
					<TextureSelector
						title="Cabinet color"
						options={getTexturesByCategory('cabinet')}
						selectedId={selections.cabinet}
						onSelect={handleSelect('cabinet')}
					/>
					<TextureSelector
						title="Floor"
						options={getTexturesByCategory('floor')}
						selectedId={selections.floor}
						onSelect={handleSelect('floor')}
					/>
				</aside>
				<section className="app__preview" aria-label="Preview">
					<KitchenPreviewCanvas
						scene={scene}
						selections={selectionOptions}
					/>
				</section>
			</main>
		</div>
	)
}

export default App
