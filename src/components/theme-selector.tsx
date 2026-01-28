import { KeyboardEvent, useState } from 'react'
import type { Theme, TextureOption } from '../types'
import { getAssetUrl } from '../lib/content'
import './theme-selector.css'

interface ThemeSelectorProps {
	themes: Theme[]
	selectedThemeId: string | null
	onSelect: (theme: Theme) => void
	textures: Map<string, TextureOption>
}

export function ThemeSelector({
	themes,
	selectedThemeId,
	onSelect,
	textures,
}: ThemeSelectorProps) {
	const handleKeyDown = (
		e: KeyboardEvent<HTMLButtonElement>,
		theme: Theme,
	) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onSelect(theme)
		}
	}

	const getThemeTextures = (theme: Theme) => {
		const result = {
			countertop: textures.get(theme.countertop),
			backsplash: textures.get(theme.backsplash),
			cabinet: textures.get(theme.cabinet),
			floor: textures.get(theme.floor),
			background: textures.get(theme.background),
		}
		
		// Debug logging for texture-based themes
		if (theme.id.startsWith('texture-')) {
			console.log(`[ThemeSelector] Theme ${theme.id}:`, {
				countertop: result.countertop ? { id: result.countertop.id, type: result.countertop.type } : null,
				backsplash: result.backsplash ? { id: result.backsplash.id, type: result.backsplash.type } : null,
				cabinet: result.cabinet ? { id: result.cabinet.id, type: result.cabinet.type } : null,
				floor: result.floor ? { id: result.floor.id, type: result.floor.type } : null,
			})
		}
		
		return result
	}

	return (
		<div className="theme-selector">
			<p className="theme-selector__description">
				Choose a predefined theme to apply all settings at once
			</p>
			<div className="theme-selector__grid" role="listbox" aria-label="Themes">
				{themes.map((theme) => {
					const isSelected = theme.id === selectedThemeId
					const themeTextures = getThemeTextures(theme)
					return (
						<button
							key={theme.id}
							type="button"
							role="option"
							aria-selected={isSelected}
							aria-label={`Select ${theme.name} theme`}
							className={`theme-selector__option ${isSelected ? 'theme-selector__option--selected' : ''}`}
							onClick={() => onSelect(theme)}
							onKeyDown={(e) => handleKeyDown(e, theme)}
							title={theme.description || theme.name}
						>
							<div className="theme-selector__content">
								<span className="theme-selector__name">{theme.name}</span>
								{theme.description && (
									<span className="theme-selector__desc">
										{theme.description}
									</span>
								)}
								<div className="theme-selector__palette" aria-label="Texture palette">
									<ThemeSwatch
										texture={themeTextures.countertop}
										title="Countertop"
										ariaLabel="Countertop"
									/>
									<ThemeSwatch
										texture={themeTextures.backsplash}
										title="Backsplash"
										ariaLabel="Backsplash"
									/>
									<ThemeSwatch
										texture={themeTextures.cabinet}
										title="Cabinet"
										ariaLabel="Cabinet"
									/>
									<ThemeSwatch
										texture={themeTextures.floor}
										title="Floor"
										ariaLabel="Floor"
									/>
									<ThemeSwatch
										texture={themeTextures.background}
										title="Background"
										ariaLabel="Background"
									/>
								</div>
							</div>
							{isSelected && (
								<span className="theme-selector__checkmark" aria-hidden>
									<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path
											d="M13.5 4L6 11.5L2.5 8"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}

function ThemeSwatch({
	texture,
	title,
	ariaLabel,
}: {
	texture: TextureOption | undefined
	title: string
	ariaLabel: string
}) {
	const [imageError, setImageError] = useState(false)
	const [imageLoaded, setImageLoaded] = useState(false)

	if (!texture) {
		return (
			<div
				className="theme-selector__swatch"
				style={{ backgroundColor: '#ccc' }}
				title={title}
				aria-label={ariaLabel}
			/>
		)
	}

	if (texture.type === 'color') {
		return (
			<div
				className="theme-selector__swatch"
				style={{ backgroundColor: texture.value }}
				title={title}
				aria-label={ariaLabel}
			/>
		)
	}

	// Texture image
	const imageUrl = getAssetUrl(texture.value)

	return (
		<div
			className="theme-selector__swatch theme-selector__swatch--texture"
			title={title}
			aria-label={ariaLabel}
		>
			{imageError ? (
				<div
					style={{
						width: '100%',
						height: '100%',
						backgroundColor: '#e5e7eb',
						borderRadius: '0.375rem',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="16" height="16" fill="#9ca3af" />
						<path d="M6 6L10 10M10 6L6 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
				</div>
			) : (
				<>
					{!imageLoaded && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								backgroundColor: '#f3f4f6',
								borderRadius: '0.375rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									width: '8px',
									height: '8px',
									backgroundColor: '#d1d5db',
									borderRadius: '50%',
									animation: 'pulse 1.5s ease-in-out infinite',
								}}
							/>
						</div>
					)}
					<img
						src={imageUrl}
						alt=""
						loading="lazy"
						onLoad={() => setImageLoaded(true)}
						onError={() => {
							setImageError(true)
							setImageLoaded(true)
						}}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							borderRadius: '0.375rem',
							display: imageLoaded ? 'block' : 'none',
						}}
					/>
				</>
			)}
		</div>
	)
}
