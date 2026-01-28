import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
import {
	getTexturesByCategory,
	getDefaultScene,
	getTextures,
	loadTextures,
	loadScenes,
	getThemes,
	loadThemes,
	getThemeById,
	getScenes,
	getAssetUrl,
} from './lib/content'
import { TextureSelector } from './components/texture-selector'
import { ThemeSelector } from './components/theme-selector'
import { KitchenPreviewCanvas } from './components/kitchen-preview-canvas'
import { Dashboard } from './components/dashboard'
import { exportToPdf, captureSvgAsImage } from './lib/pdf-export'
import { saveDesign, generateThumbnail, getAllSavedDesigns } from './lib/storage'
import type { KitchenSelections, TextureOption, Theme, SavedDesign } from './types'
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
	// Check if app has expired (January 31 or later)
	const checkExpiration = () => {
		const now = new Date()
		const expirationDate = new Date(now.getFullYear(), 0, 31) // January 31 of current year
		return now >= expirationDate
	}

	if (checkExpiration()) {
		return (
			<div className="app app--expired">
				<div className="app__expired-message">
					<h1 className="app__expired-title">This app has expired</h1>
					<p className="app__expired-text">Please contact the developer</p>
				</div>
			</div>
		)
	}

	const [contentReady, setContentReady] = useState(false)
	useEffect(() => {
		Promise.all([loadTextures(), loadScenes(), loadThemes()]).then(() =>
			setContentReady(true),
		)
	}, [])

	const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
	const scenes = useMemo(() => getScenes(), [contentReady])
	const scene = useMemo(() => {
		if (!scenes.length) return getDefaultScene()
		if (selectedSceneId) {
			return scenes.find((s) => s.id === selectedSceneId) ?? scenes[0]
		}
		// Default: use the default scene from config
		return scenes.find((s) => s.isDefault) ?? scenes[0]
	}, [scenes, selectedSceneId])
	const [selections, setSelections] = useState<KitchenSelections>(
		getDefaultSelections,
	)
	const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)

	// Apply Classic Wood theme by default when content is ready (only if no design was loaded)
	const [hasLoadedDesign, setHasLoadedDesign] = useState(false)
	useEffect(() => {
		if (contentReady && !hasLoadedDesign) {
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
	}, [contentReady, hasLoadedDesign])
	const svgRef = useRef<SVGSVGElement | null>(null)
	const [isExporting, setIsExporting] = useState(false)
	const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'textures'>('themes')
	const [view, setView] = useState<'dashboard' | 'editor'>('dashboard')
	const [showSaveModal, setShowSaveModal] = useState(false)
	const [saveName, setSaveName] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	// Preload all texture images when textures tab becomes active
	useEffect(() => {
		if (activeTab === 'textures' && contentReady) {
			const textureOptions = getTextures().filter(t => t.type === 'texture')
			console.log(`[App] Preloading ${textureOptions.length} texture images...`)
			
			const preloadPromises = textureOptions.map(opt => {
				return new Promise<void>((resolve) => {
					const img = new Image()
					img.onload = () => resolve()
					img.onerror = () => {
						console.warn(`Failed to preload texture: ${opt.value}`)
						resolve() // Resolve anyway to not block other images
					}
					img.src = getAssetUrl(opt.value)
				})
			})
			
			Promise.all(preloadPromises).then(() => {
				console.log(`[App] Successfully preloaded ${textureOptions.length} texture images`)
			})
		}
	}, [activeTab, contentReady])

	// Create textureMap AFTER textures are loaded to ensure it includes all textures
	const textureMap = useMemo(() => {
		// Use getTextures() which will use cachedTextures if available (from loadTextures)
		// or fall back to bundled textures
		const list = getTextures()
		const map = new Map<string, TextureOption>(list.map((t) => [t.id, t]))
		
		// Debug: Log texture types
		const textureTypes = list.reduce((acc, t) => {
			acc[t.type] = (acc[t.type] || 0) + 1
			return acc
		}, {} as Record<string, number>)
		console.log('[App] Texture map created:', {
			total: list.length,
			byType: textureTypes,
			sampleTexture: list.find(t => t.type === 'texture'),
			sampleColor: list.find(t => t.type === 'color'),
			contentReady
		})
		
		return map
	}, [contentReady]) // Depend on contentReady to rebuild when textures are loaded

	const selectionOptions = useMemo(
		() => {
			const options = {
				countertop: textureMap.get(selections.countertop),
				backsplash: textureMap.get(selections.backsplash),
				cabinet: textureMap.get(selections.cabinet),
				floor: textureMap.get(selections.floor),
				background: textureMap.get(selections.background),
			}
			
			// Debug logging
			if (options.countertop) {
				console.log('[App] Countertop selection:', {
					id: selections.countertop,
					type: options.countertop.type,
					value: options.countertop.value,
					found: !!options.countertop
				})
			}
			if (options.floor) {
				console.log('[App] Floor selection:', {
					id: selections.floor,
					type: options.floor.type,
					value: options.floor.value,
					found: !!options.floor
				})
			}
			
			return options
		},
		[selections, textureMap],
	)

	const themes = useMemo(() => {
		// Use getThemes() which will use cachedThemes if available (from loadThemes)
		// or fall back to bundled themes
		const themeList = getThemes()
		console.log('[App] Themes loaded:', {
			total: themeList.length,
			textureThemes: themeList.filter(t => t.id.startsWith('texture-')).length,
			sampleTheme: themeList.find(t => t.id.startsWith('texture-')),
			contentReady
		})
		return themeList
	}, [contentReady])

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

	const handleSaveDesign = async () => {
		if (!svgRef.current || !saveName.trim() || isSaving) return

		setIsSaving(true)
		try {
			const thumbnail = await generateThumbnail(svgRef.current)
			saveDesign(
				saveName.trim(),
				selections,
				scene?.id || '',
				selectedThemeId,
				thumbnail,
			)
			setShowSaveModal(false)
			setSaveName('')
			setView('dashboard')
		} catch (error) {
			console.error('Failed to save design:', error)
			alert('Failed to save design. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleLoadDesign = (design: SavedDesign) => {
		setSelections(design.selections)
		setSelectedSceneId(design.sceneId)
		setSelectedThemeId(design.themeId)
		setHasLoadedDesign(true)
		setView('editor')
	}

	const handleNewDesign = () => {
		setSelections(getDefaultSelections())
		setSelectedSceneId(null)
		setSelectedThemeId(null)
		setHasLoadedDesign(false)
		setView('editor')
	}

	if (!scene) {
		return (
			<div className="app app--error">
				<p>No kitchen scene configured. Add scenes in the CMS.</p>
			</div>
		)
	}

	if (view === 'dashboard') {
		const savedDesigns = getAllSavedDesigns()
		const isLandingPage = savedDesigns.length === 0
		
		return (
			<div className="app">
				{!isLandingPage && (
					<header className="app__header">
						<div className="app__logo">
							<svg className="app__logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="4" y="6" width="24" height="20" rx="2" fill="url(#logoGradient)" opacity="0.1"/>
								<path d="M8 12H24M8 16H24M8 20H20" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<circle cx="12" cy="8" r="1.5" fill="url(#logoGradient)"/>
								<circle cx="20" cy="8" r="1.5" fill="url(#logoGradient)"/>
								<path d="M26 10L28 12L26 14" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<defs>
									<linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
										<stop stopColor="#2563eb"/>
										<stop offset="1" stopColor="#1e40af"/>
									</linearGradient>
								</defs>
							</svg>
							<div className="app__logo-text">
								<span className="app__logo-name">Kitchen Preview</span>
								<span className="app__logo-tagline">Design Studio</span>
							</div>
						</div>
					</header>
				)}
				<main className="app__main">
					<Dashboard onLoadDesign={handleLoadDesign} onNewDesign={handleNewDesign} />
				</main>
			</div>
		)
	}

	return (
		<div className="app">
		<header className="app__header">
			<div className="app__logo">
				<svg className="app__logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="4" y="6" width="24" height="20" rx="2" fill="url(#logoGradient)" opacity="0.1"/>
					<path d="M8 12H24M8 16H24M8 20H20" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					<circle cx="12" cy="8" r="1.5" fill="url(#logoGradient)"/>
					<circle cx="20" cy="8" r="1.5" fill="url(#logoGradient)"/>
					<path d="M26 10L28 12L26 14" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					<defs>
						<linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
							<stop stopColor="#2563eb"/>
							<stop offset="1" stopColor="#1e40af"/>
						</linearGradient>
					</defs>
				</svg>
				<div className="app__logo-text">
					<span className="app__logo-name">Kitchen Preview</span>
					<span className="app__logo-tagline">Design Studio</span>
				</div>
			</div>
			<div className="app__header-actions">
				<button
					type="button"
					className="app__back-btn"
					onClick={() => setView('dashboard')}
					aria-label="Back to dashboard"
				>
					<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
					Dashboard
				</button>
				<select
					className="app__scene-select"
					value={scene?.id ?? ''}
					onChange={(e) => setSelectedSceneId(e.target.value)}
					aria-label="Select kitchen view"
				>
					{scenes.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name}
						</option>
					))}
				</select>
				<button
					type="button"
					className="app__save-btn"
					onClick={() => setShowSaveModal(true)}
					disabled={!svgRef.current}
					aria-label="Save design"
				>
					<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M13 4L12 3L8 3L7 4L3 4C2.44772 4 2 4.44772 2 5V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5C14 4.44772 13.5523 4 13 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						<path d="M6 7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
					Save
				</button>
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
			</div>
		</header>
		<main className="app__main">
			<div className="app__main-content">
				<aside className="app__sidebar">
					<nav className="app__sidebar-nav" aria-label="Selection menu">
						<button
							type="button"
							className={`app__nav-item ${activeTab === 'themes' ? 'app__nav-item--active' : ''}`}
							onClick={() => setActiveTab('themes')}
							aria-selected={activeTab === 'themes'}
							aria-controls="themes-panel"
							id="themes-tab"
						>
							<svg className="app__nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
								<path d="M3 7H17M7 3V7M13 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
							<span>Themes</span>
						</button>
						<button
							type="button"
							className={`app__nav-item ${activeTab === 'colors' ? 'app__nav-item--active' : ''}`}
							onClick={() => setActiveTab('colors')}
							aria-selected={activeTab === 'colors'}
							aria-controls="colors-panel"
							id="colors-tab"
						>
							<svg className="app__nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="6" cy="6" r="2.5" fill="#EF4444" stroke="currentColor" strokeWidth="0.5"/>
								<circle cx="14" cy="6" r="2.5" fill="#3B82F6" stroke="currentColor" strokeWidth="0.5"/>
								<circle cx="6" cy="14" r="2.5" fill="#10B981" stroke="currentColor" strokeWidth="0.5"/>
								<circle cx="14" cy="14" r="2.5" fill="#F59E0B" stroke="currentColor" strokeWidth="0.5"/>
								<circle cx="10" cy="10" r="2.5" fill="#8B5CF6" stroke="currentColor" strokeWidth="0.5"/>
							</svg>
							<span>Colors</span>
						</button>
						<button
							type="button"
							className={`app__nav-item ${activeTab === 'textures' ? 'app__nav-item--active' : ''}`}
							onClick={() => setActiveTab('textures')}
							aria-selected={activeTab === 'textures'}
							aria-controls="textures-panel"
							id="textures-tab"
						>
							<svg className="app__nav-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 4H17M3 8H17M3 12H17M3 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
							<span>Textures</span>
						</button>
					</nav>
					<div className="app__sidebar-content">
						<div
							id="themes-panel"
							role="tabpanel"
							aria-labelledby="themes-tab"
							className={`app__tab-panel ${activeTab === 'themes' ? 'app__tab-panel--active' : ''}`}
						>
							<ThemeSelector
								themes={themes}
								selectedThemeId={selectedThemeId}
								onSelect={handleThemeSelect}
								textures={textureMap}
							/>
						</div>
						<div
							id="colors-panel"
							role="tabpanel"
							aria-labelledby="colors-tab"
							className={`app__tab-panel ${activeTab === 'colors' ? 'app__tab-panel--active' : ''}`}
						>
							<div className="app__sidebar-header">
								<h2 className="app__sidebar-title">Customize Colors</h2>
								<p className="app__sidebar-subtitle">
									Select individual colors for each element
								</p>
							</div>
							<TextureSelector
								title="Countertop"
								options={getTexturesByCategory('countertop', 'color')}
								selectedId={selections.countertop}
								onSelect={handleSelect('countertop')}
							/>
							<TextureSelector
								title="Backsplash"
								options={getTexturesByCategory('backsplash', 'color')}
								selectedId={selections.backsplash}
								onSelect={handleSelect('backsplash')}
							/>
							<TextureSelector
								title="Cabinet color"
								options={getTexturesByCategory('cabinet', 'color')}
								selectedId={selections.cabinet}
								onSelect={handleSelect('cabinet')}
							/>
							<TextureSelector
								title="Floor"
								options={getTexturesByCategory('floor', 'color')}
								selectedId={selections.floor}
								onSelect={handleSelect('floor')}
							/>
							<TextureSelector
								title="Background"
								options={getTexturesByCategory('background', 'color')}
								selectedId={selections.background}
								onSelect={handleSelect('background')}
							/>
						</div>
						<div
							id="textures-panel"
							role="tabpanel"
							aria-labelledby="textures-tab"
							className={`app__tab-panel ${activeTab === 'textures' ? 'app__tab-panel--active' : ''}`}
						>
							<div className="app__sidebar-header">
								<h2 className="app__sidebar-title">Texture Images</h2>
								<p className="app__sidebar-subtitle">
									Select texture images for each element
								</p>
							</div>
							<TextureSelector
								title="Countertop"
								options={getTexturesByCategory('countertop', 'texture')}
								selectedId={selections.countertop}
								onSelect={handleSelect('countertop')}
							/>
							<TextureSelector
								title="Backsplash"
								options={getTexturesByCategory('backsplash', 'texture')}
								selectedId={selections.backsplash}
								onSelect={handleSelect('backsplash')}
							/>
							<TextureSelector
								title="Cabinet"
								options={getTexturesByCategory('cabinet', 'texture')}
								selectedId={selections.cabinet}
								onSelect={handleSelect('cabinet')}
							/>
							<TextureSelector
								title="Floor"
								options={getTexturesByCategory('floor', 'texture')}
								selectedId={selections.floor}
								onSelect={handleSelect('floor')}
							/>
						</div>
					</div>
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
		{showSaveModal && (
			<div className="app__modal-overlay" onClick={() => !isSaving && setShowSaveModal(false)}>
				<div className="app__modal" onClick={(e) => e.stopPropagation()}>
					<h2 className="app__modal-title">Save Design</h2>
					<p className="app__modal-text">Give your design a name to save it</p>
					<input
						type="text"
						className="app__modal-input"
						value={saveName}
						onChange={(e) => setSaveName(e.target.value)}
						placeholder="My Kitchen Design"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && saveName.trim() && !isSaving) {
								handleSaveDesign()
							}
							if (e.key === 'Escape') {
								setShowSaveModal(false)
							}
						}}
						autoFocus
						disabled={isSaving}
					/>
					<div className="app__modal-actions">
						<button
							type="button"
							className="app__modal-btn app__modal-btn--cancel"
							onClick={() => setShowSaveModal(false)}
							disabled={isSaving}
						>
							Cancel
						</button>
						<button
							type="button"
							className="app__modal-btn app__modal-btn--save"
							onClick={handleSaveDesign}
							disabled={!saveName.trim() || isSaving}
						>
							{isSaving ? 'Saving...' : 'Save Design'}
						</button>
					</div>
				</div>
			</div>
		)}
		</div>
	)
}

export default App
