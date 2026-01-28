import { KeyboardEvent } from 'react'
import type { Theme } from '../types'
import './theme-selector.css'

interface ThemeSelectorProps {
	themes: Theme[]
	selectedThemeId: string | null
	onSelect: (theme: Theme) => void
}

export function ThemeSelector({
	themes,
	selectedThemeId,
	onSelect,
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

	return (
		<div className="theme-selector">
			<h2 className="theme-selector__title">Themes</h2>
			<p className="theme-selector__description">
				Choose a predefined theme to apply all settings at once
			</p>
			<div className="theme-selector__grid" role="listbox" aria-label="Themes">
				{themes.map((theme) => {
					const isSelected = theme.id === selectedThemeId
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
