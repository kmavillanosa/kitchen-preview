import { useState, useEffect } from 'react'
import { getAllSavedDesigns, deleteSavedDesign, deleteAllSavedDesigns } from '../lib/storage'
import { getAssetUrl, getThemeById, getScenes } from '../lib/content'
import type { SavedDesign } from '../types'
import './dashboard.css'

interface DashboardProps {
	onLoadDesign: (design: SavedDesign) => void
	onNewDesign: () => void
}

export function Dashboard({ onLoadDesign, onNewDesign }: DashboardProps) {
	const [designs, setDesigns] = useState<SavedDesign[]>([])
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
	const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
	const [isAnimating, setIsAnimating] = useState(true)

	useEffect(() => {
		setDesigns(getAllSavedDesigns())
		// Trigger animation after component mounts
		setTimeout(() => setIsAnimating(false), 100)
	}, [])

	const handleDelete = (id: string) => {
		if (deleteConfirmId === id) {
			if (deleteSavedDesign(id)) {
				setDesigns(getAllSavedDesigns())
				setDeleteConfirmId(null)
			}
		} else {
			setDeleteConfirmId(id)
		}
	}

	const handleLoad = (design: SavedDesign) => {
		onLoadDesign(design)
	}

	const handleDeleteAll = () => {
		if (showDeleteAllConfirm) {
			if (deleteAllSavedDesigns()) {
				setDesigns([])
				setShowDeleteAllConfirm(false)
			}
		} else {
			setShowDeleteAllConfirm(true)
		}
	}

	if (designs.length === 0) {
		return (
			<div className="dashboard dashboard--landing">
				<div className="landing">
					<div className="landing__hero">
						<div className="landing__hero-content">
							<h1 className="landing__title">
								Design Your Dream Kitchen
							</h1>
							<p className="landing__subtitle">
								Visualize your perfect kitchen with our intuitive design tool. 
								Mix and match colors, textures, and materials to create stunning 
								kitchen designs in minutes.
							</p>
							<button
								type="button"
								className="landing__cta-btn"
								onClick={onNewDesign}
							>
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
								Start Designing
							</button>
						</div>
						<div className="landing__hero-visual">
							<div className="landing__preview-mock">
								<img 
									src={getAssetUrl('hero.svg')} 
									alt="Kitchen Preview" 
									className="landing__hero-image"
								/>
							</div>
						</div>
					</div>

					<div className="landing__features">
						<div className="landing__feature">
							<div className="landing__feature-icon">
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</div>
							<h3 className="landing__feature-title">Predefined Themes</h3>
							<p className="landing__feature-text">
								Choose from professionally curated themes or create your own custom design
							</p>
						</div>
						<div className="landing__feature">
							<div className="landing__feature-icon">
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="6" cy="6" r="2.5" fill="#EF4444" stroke="currentColor" strokeWidth="0.5"/>
									<circle cx="18" cy="6" r="2.5" fill="#3B82F6" stroke="currentColor" strokeWidth="0.5"/>
									<circle cx="6" cy="18" r="2.5" fill="#10B981" stroke="currentColor" strokeWidth="0.5"/>
									<circle cx="18" cy="18" r="2.5" fill="#F59E0B" stroke="currentColor" strokeWidth="0.5"/>
									<circle cx="12" cy="12" r="2.5" fill="#8B5CF6" stroke="currentColor" strokeWidth="0.5"/>
								</svg>
							</div>
							<h3 className="landing__feature-title">Custom Colors</h3>
							<p className="landing__feature-text">
								Select from a wide range of colors for countertops, cabinets, floors, and more
							</p>
						</div>
						<div className="landing__feature">
							<div className="landing__feature-icon">
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3 4H21M3 8H21M3 12H21M3 16H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</div>
							<h3 className="landing__feature-title">Real Textures</h3>
							<p className="landing__feature-text">
								Apply realistic textures and materials to see how your kitchen will look
							</p>
						</div>
						<div className="landing__feature">
							<div className="landing__feature-icon">
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</div>
							<h3 className="landing__feature-title">Save & Export</h3>
							<p className="landing__feature-text">
								Save your designs and export them as PDFs to share with clients or contractors
							</p>
						</div>
					</div>

					<div className="landing__cta-section">
						<h2 className="landing__cta-title">Ready to Get Started?</h2>
						<p className="landing__cta-text">
							Create your first kitchen design in seconds. No sign-up required.
						</p>
						<button
							type="button"
							className="landing__cta-btn landing__cta-btn--secondary"
							onClick={onNewDesign}
						>
							<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
							Create Your First Design
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={`dashboard ${isAnimating ? 'dashboard--animating' : ''}`}>
			<div className="dashboard__header">
				<div>
					<h1 className="dashboard__title">My Designs</h1>
					<p className="dashboard__subtitle">
						{designs.length} {designs.length === 1 ? 'design' : 'designs'} saved
					</p>
				</div>
				<div className="dashboard__header-actions">
					<button
						type="button"
						className="dashboard__delete-all-btn"
						onClick={handleDeleteAll}
						aria-label="Delete all designs"
					>
						{showDeleteAllConfirm ? (
							<>
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
								Confirm Delete All
							</>
						) : (
							<>
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M4 6H12M6 6V14C6 14.5523 6.44772 15 7 15H9C9.55228 15 10 14.5523 10 14V6M6 6V4C6 3.44772 6.44772 3 7 3H9C9.55228 3 10 3.44772 10 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
								Delete All
							</>
						)}
					</button>
					<button
						type="button"
						className="dashboard__new-btn dashboard__new-btn--header"
						onClick={onNewDesign}
					>
						<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						New Design
					</button>
				</div>
			</div>
			<div className="dashboard__grid">
				{designs.map((design, index) => {
					const theme = design.themeId ? getThemeById(design.themeId) : null
					const scene = getScenes().find(s => s.id === design.sceneId)
					const updatedDate = new Date(design.updatedAt)
					const isRecent = Date.now() - updatedDate.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
					
					return (
						<div 
							key={design.id} 
							className="dashboard__card"
							style={{ animationDelay: `${index * 0.05}s` }}
						>
							<div className="dashboard__card-thumbnail">
								{design.thumbnail ? (
									<img src={design.thumbnail} alt={design.name} />
								) : (
									<div className="dashboard__card-placeholder">
										<svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect width="64" height="48" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1"/>
											<path d="M20 20H44M20 28H36M20 36H28" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									</div>
								)}
								<div className="dashboard__card-overlay">
									<button
										type="button"
										className="dashboard__card-preview-btn"
										onClick={() => handleLoad(design)}
										aria-label={`Preview ${design.name}`}
									>
										<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3ZM8 11C6.34315 11 5 9.65685 5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11Z" fill="currentColor"/>
											<path d="M8 5.5C7.58579 5.5 7.25 5.83579 7.25 6.25C7.25 6.66421 7.58579 7 8 7C8.41421 7 8.75 6.66421 8.75 6.25C8.75 5.83579 8.41421 5.5 8 5.5Z" fill="currentColor"/>
										</svg>
										Preview
									</button>
								</div>
							</div>
							<div className="dashboard__card-content">
								<div className="dashboard__card-header">
									<h3 className="dashboard__card-title">{design.name}</h3>
									{isRecent && (
										<span className="dashboard__card-badge">New</span>
									)}
								</div>
								<div className="dashboard__card-meta">
									{theme && (
										<div className="dashboard__card-meta-item">
											<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 2L2 7L12 12L14 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
											<span>{theme.name}</span>
										</div>
									)}
									{scene && (
										<div className="dashboard__card-meta-item">
											<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
											<span>{scene.name}</span>
										</div>
									)}
								</div>
								<p className="dashboard__card-date">
									Updated {updatedDate.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: updatedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
									})}
								</p>
							</div>
							<div className="dashboard__card-actions">
								<button
									type="button"
									className="dashboard__card-btn dashboard__card-btn--load"
									onClick={() => handleLoad(design)}
									aria-label={`Load ${design.name}`}
								>
									<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M8 3V13M3 8L8 3L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
									Load
								</button>
								<button
									type="button"
									className="dashboard__card-btn dashboard__card-btn--delete"
									onClick={() => handleDelete(design.id)}
									aria-label={`Delete ${design.name}`}
								>
									{deleteConfirmId === design.id ? (
										<>
											<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
											Confirm
										</>
									) : (
										<>
											<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M4 6H12M6 6V14C6 14.5523 6.44772 15 7 15H9C9.55228 15 10 14.5523 10 14V6M6 6V4C6 3.44772 6.44772 3 7 3H9C9.55228 3 10 3.44772 10 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
											Delete
										</>
									)}
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
