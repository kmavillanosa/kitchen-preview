import { useState } from 'react'
import type { TextureOption } from '../types'
import { getAssetUrl } from '../lib/content'
import './texture-selector.css'

interface TextureSelectorProps {
	title: string
	options: TextureOption[]
	selectedId: string
	onSelect: (id: string) => void
}

export function TextureSelector({
	title,
	options,
	selectedId,
	onSelect,
}: TextureSelectorProps) {
	return (
		<div className="texture-selector">
			<h3 className="texture-selector__title">{title}</h3>
			<ul className="texture-selector__list" role="listbox" aria-label={title}>
				{options.map((opt) => {
					const isSelected = opt.id === selectedId
					return (
						<li key={opt.id} className="texture-selector__item">
							<button
								type="button"
								role="option"
								aria-selected={isSelected}
								className={`texture-selector__option ${isSelected ? 'texture-selector__option--selected' : ''}`}
								onClick={() => onSelect(opt.id)}
							>
								{opt.type === 'color' ? (
									<span
										className="texture-selector__swatch"
										style={{ backgroundColor: opt.value }}
										aria-hidden
									/>
								) : (
									<TextureImage src={getAssetUrl(opt.value)} alt={opt.label} />
								)}
								<span className="texture-selector__label">{opt.label}</span>
							</button>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

function TextureImage({ src, alt }: { src: string; alt: string }) {
	const [imageError, setImageError] = useState(false)
	const [imageLoaded, setImageLoaded] = useState(false)

	if (imageError) {
		// Fallback to a placeholder when image fails to load
		return (
			<span
				className="texture-selector__thumb texture-selector__thumb--placeholder"
				aria-hidden
				title={`${alt} (image not found)`}
			>
				<svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="32" height="24" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
					<path d="M10 9L16 15L22 9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</span>
		)
	}

	return (
		<>
			{!imageLoaded && (
				<span
					className="texture-selector__thumb texture-selector__thumb--loading"
					aria-hidden
				>
					<svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="32" height="24" fill="#f9fafb" />
						<circle cx="16" cy="12" r="3" fill="#e5e7eb">
							<animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
						</circle>
					</svg>
				</span>
			)}
			<img
				className="texture-selector__thumb"
				src={src}
				alt=""
				loading="lazy"
				onLoad={() => setImageLoaded(true)}
				onError={() => {
					setImageError(true)
					setImageLoaded(true)
					console.warn(`Failed to load texture image: ${src}`)
				}}
				style={{ display: imageLoaded ? 'block' : 'none' }}
			/>
		</>
	)
}
