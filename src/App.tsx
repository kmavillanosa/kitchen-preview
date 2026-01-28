import { useMemo, useState, useEffect, useRef } from 'react'
import {
	getTexturesByCategory,
	getDefaultScene,
	getTextures,
	loadTextures,
	loadScenes,
	getThemes,
	loadThemes,
	getThemeById,
} from './lib/content'
import { TextureSelector } from './components/texture-selector'
import { ThemeSelector } from './components/theme-selector'
import { KitchenPreviewCanvas } from './components/kitchen-preview-canvas'
import { exportToPdf, captureSvgAsImage } from './lib/pdf-export'
import type { KitchenSelections, TextureOption, Theme } from './types'
import './App.css'

function getDefaultSelections(): KitchenSelections {
	const countertops = getTexturesByCategory('countertop')
	const backsplash = getTexturesByCategory('backsplash')
	const cabinet = getTexturesByCategory('cabinet')
	const floor = getTexturesByCategory('floor')
	const background = getTexturesByCategory('background')
	return {
		countertop: countertops[0]?.id ?? '',
		backsplash: backsplash[0]?.id ?? '',
		cabinet: cabinet[0]?.id ?? '',
		floor: floor[0]?.id ?? '',
		background: background[0]?.id ?? '',
	}
}

function App() {
	const [contentReady, setContentReady] = useState(false)
	useEffect(() => {
		Promise.all([loadTextures(), loadScenes(), loadThemes()]).then(() =>
			setContentReady(true),
		)
	}, [])

	const scene = useMemo(() => getDefaultScene(), [contentReady])
	const [selections, setSelections] = useState<KitchenSelections>(
		getDefaultSelections,
	)
	const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)

	// Apply Classic Wood theme by default when content is ready
	useEffect(() => {
		if (contentReady) {
			const defaultTheme = getThemeById('classic-wood')
			if (defaultTheme) {
				setSelections({
					countertop: defaultTheme.countertop,
					backsplash: defaultTheme.backsplash,
					cabinet: defaultTheme.cabinet,
					floor: defaultTheme.floor,
					background: defaultTheme.background,
				})
				setSelectedThemeId('classic-wood')
			}
		}
	}, [contentReady])
	const svgRef = useRef<SVGSVGElement | null>(null)
	const [isExporting, setIsExporting] = useState(false)

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
			background: textureMap.get(selections.background),
		}),
		[selections, textureMap],
	)

	const themes = useMemo(() => getThemes(), [])

	const handleSelect =
		(category: keyof KitchenSelections) => (id: string) => {
			setSelections((prev) => ({ ...prev, [category]: id }))
			setSelectedThemeId(null)
		}

	const handleThemeSelect = (theme: Theme) => {
		setSelections({
			countertop: theme.countertop,
			backsplash: theme.backsplash,
			cabinet: theme.cabinet,
			floor: theme.floor,
			background: theme.background,
		})
		setSelectedThemeId(theme.id)
	}

	const handleExportPdf = async () => {
		if (!svgRef.current || isExporting) return

		setIsExporting(true)
		try {
			const previewImage = await captureSvgAsImage(svgRef.current)
			const selectedTheme = themes.find((t) => t.id === selectedThemeId) || null

			await exportToPdf({
				previewImage,
				selections: selectionOptions,
				selectedTheme,
				sceneName: scene?.name || 'Kitchen',
			})
		} catch (error) {
			console.error('Failed to export PDF:', error)
			alert('Failed to export PDF. Please try again.')
		} finally {
			setIsExporting(false)
		}
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
			<div className="app__header-actions">
				<button
					type="button"
					className="app__export-btn"
					onClick={handleExportPdf}
					disabled={isExporting || !svgRef.current}
					aria-label="Export to PDF"
				>
					{isExporting ? (
						<>
							<svg
								className="app__export-icon app__export-icon--spinning"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="8"
									cy="8"
									r="6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeDasharray="31.416"
									strokeDashoffset="23.562"
								>
									<animateTransform
										attributeName="transform"
										type="rotate"
										from="0 8 8"
										to="360 8 8"
										dur="1s"
										repeatCount="indefinite"
									/>
								</circle>
							</svg>
							<span>Exporting...</span>
						</>
					) : (
						<>
							<svg
								className="app__export-icon"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M5 6L8 3L11 6"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M8 3V11"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>Export PDF</span>
						</>
					)}
				</button>
				<a href="/kitchen-preview/admin/" className="app__admin-link">
					Admin
				</a>
			</div>
		</header>
		<main className="app__main">
			<div className="app__themes-section">
				<ThemeSelector
					themes={themes}
					selectedThemeId={selectedThemeId}
					onSelect={handleThemeSelect}
					textures={textureMap}
				/>
			</div>
			<div className="app__main-content">
				<aside className="app__sidebar">
					<div className="app__sidebar-header">
						<h2 className="app__sidebar-title">Customize Colors</h2>
						<p className="app__sidebar-subtitle">
							Select individual colors for each element
						</p>
					</div>
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
					<TextureSelector
						title="Background"
						options={getTexturesByCategory('background')}
						selectedId={selections.background}
						onSelect={handleSelect('background')}
					/>
				</aside>
				<section className="app__preview" aria-label="Preview">
					<KitchenPreviewCanvas
						scene={scene}
						selections={selectionOptions}
						onSvgReady={(svg) => {
							svgRef.current = svg
						}}
					/>
				</section>
			</div>
		</main>
		</div>
	)
}

export default App
