import { KeyboardEvent } from 'react'
import type { Theme, TextureOption } from '../types'
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

	const getThemeColors = (theme: Theme) => {
		return {
			countertop: textures.get(theme.countertop)?.value || '#ccc',
			backsplash: textures.get(theme.backsplash)?.value || '#ccc',
			cabinet: textures.get(theme.cabinet)?.value || '#ccc',
			floor: textures.get(theme.floor)?.value || '#ccc',
			background: textures.get(theme.background)?.value || '#ccc',
		}
	}

	return (
		<div className="theme-selector">
			<h2 className="theme-selector__title">Themes</h2>
			<p className="theme-selector__description">
				Choose a predefined theme to apply all settings at once
			</p>
			<div className="theme-selector__grid" role="listbox" aria-label="Themes">
				{themes.map((theme) => {
					const isSelected = theme.id === selectedThemeId
					const colors = getThemeColors(theme)
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
								<div className="theme-selector__palette" aria-label="Color palette">
									<div
										className="theme-selector__swatch"
										style={{ backgroundColor: colors.countertop }}
										title="Countertop"
										aria-label="Countertop color"
									/>
									<div
										className="theme-selector__swatch"
										style={{ backgroundColor: colors.backsplash }}
										title="Backsplash"
										aria-label="Backsplash color"
									/>
									<div
										className="theme-selector__swatch"
										style={{ backgroundColor: colors.cabinet }}
										title="Cabinet"
										aria-label="Cabinet color"
									/>
									<div
										className="theme-selector__swatch"
										style={{ backgroundColor: colors.floor }}
										title="Floor"
										aria-label="Floor color"
									/>
									<div
										className="theme-selector__swatch"
										style={{ backgroundColor: colors.background }}
										title="Background"
										aria-label="Background color"
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
