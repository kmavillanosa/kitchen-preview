/**
 * Script to generate texture images for the kitchen preview tool
 * Run with: node scripts/generate-textures.js
 */

const fs = require('fs')
const path = require('path')
const { createCanvas } = require('canvas')

const texturesDir = path.join(__dirname, '..', 'public', 'textures')

// Ensure textures directory exists
if (!fs.existsSync(texturesDir)) {
	fs.mkdirSync(texturesDir, { recursive: true })
}

// Countertop textures
const countertopTextures = [
	{
		name: 'countertop-marble-white',
		description: 'White Carrara marble with gray veining',
		generate: (canvas, ctx) => {
			// Marble pattern
			ctx.fillStyle = '#f5f5f0'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add veining
			ctx.strokeStyle = '#d0d0d0'
			ctx.lineWidth = 2
			ctx.beginPath()
			for (let i = 0; i < 20; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				ctx.moveTo(x, y)
				ctx.quadraticCurveTo(
					x + (Math.random() - 0.5) * 100,
					y + (Math.random() - 0.5) * 100,
					x + (Math.random() - 0.5) * 150,
					y + (Math.random() - 0.5) * 150
				)
			}
			ctx.stroke()
		},
	},
	{
		name: 'countertop-granite-dark',
		description: 'Dark gray granite with speckles',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#4a4a4a'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add speckles
			for (let i = 0; i < 500; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				const size = Math.random() * 3
				ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.8)`
				ctx.beginPath()
				ctx.arc(x, y, size, 0, Math.PI * 2)
				ctx.fill()
			}
		},
	},
	{
		name: 'countertop-quartz-white',
		description: 'White quartz with sparkle',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#ffffff'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add subtle sparkle
			for (let i = 0; i < 200; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				ctx.fillStyle = `rgba(200, 200, 255, ${Math.random() * 0.3})`
				ctx.fillRect(x, y, 1, 1)
			}
		},
	},
	{
		name: 'countertop-butcher-block',
		description: 'Natural wood butcher block',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#8b6914'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood grain
			for (let i = 0; i < 10; i++) {
				const y = i * 40
				ctx.strokeStyle = `rgba(${100 + Math.random() * 50}, ${80 + Math.random() * 40}, ${40 + Math.random() * 20}, 0.6)`
				ctx.lineWidth = 2
				ctx.beginPath()
				ctx.moveTo(0, y)
				for (let x = 0; x < 400; x += 10) {
					ctx.lineTo(x, y + Math.sin(x / 20) * 3)
				}
				ctx.stroke()
			}
		},
	},
	{
		name: 'countertop-concrete',
		description: 'Polished concrete',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#6b6b6b'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add aggregate texture
			for (let i = 0; i < 300; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				const size = Math.random() * 2
				ctx.fillStyle = `rgba(${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${80 + Math.random() * 40}, 0.5)`
				ctx.beginPath()
				ctx.arc(x, y, size, 0, Math.PI * 2)
				ctx.fill()
			}
		},
	},
]

// Backsplash textures
const backsplashTextures = [
	{
		name: 'backsplash-subway-white',
		description: 'White subway tile',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#f5f5f0'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add tile grid
			ctx.strokeStyle = '#e0e0e0'
			ctx.lineWidth = 2
			const tileWidth = 80
			const tileHeight = 40
			for (let y = 0; y < 400; y += tileHeight) {
				for (let x = 0; x < 400; x += tileWidth) {
					ctx.strokeRect(x, y, tileWidth, tileHeight)
				}
			}
		},
	},
	{
		name: 'backsplash-mosaic-blue',
		description: 'Blue mosaic tile',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#4a6fa5'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add mosaic pattern
			const tileSize = 20
			for (let y = 0; y < 400; y += tileSize) {
				for (let x = 0; x < 400; x += tileSize) {
					ctx.fillStyle = `hsl(${200 + Math.random() * 20}, ${60 + Math.random() * 20}%, ${50 + Math.random() * 10}%)`
					ctx.fillRect(x, y, tileSize, tileSize)
					ctx.strokeStyle = '#2c4a70'
					ctx.strokeRect(x, y, tileSize, tileSize)
				}
			}
		},
	},
	{
		name: 'backsplash-herringbone',
		description: 'Herringbone pattern tile',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#d4c4a8'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add herringbone pattern
			const tileWidth = 40
			const tileHeight = 20
			ctx.strokeStyle = '#b8a890'
			ctx.lineWidth = 1
			for (let y = 0; y < 400; y += tileHeight) {
				const offset = (y / tileHeight) % 2 === 0 ? 0 : tileWidth / 2
				for (let x = -tileWidth; x < 450; x += tileWidth) {
					ctx.beginPath()
					ctx.moveTo(x + offset, y)
					ctx.lineTo(x + offset + tileWidth / 2, y + tileHeight)
					ctx.lineTo(x + offset + tileWidth, y)
					ctx.closePath()
					ctx.stroke()
				}
			}
		},
	},
	{
		name: 'backsplash-brick',
		description: 'Brick pattern',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#c97d60'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add brick pattern
			const brickWidth = 80
			const brickHeight = 30
			ctx.strokeStyle = '#a05d45'
			ctx.lineWidth = 2
			for (let y = 0; y < 400; y += brickHeight) {
				const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2
				for (let x = -brickWidth; x < 450; x += brickWidth) {
					ctx.strokeRect(x + offset, y, brickWidth, brickHeight)
				}
			}
		},
	},
	{
		name: 'backsplash-stone',
		description: 'Natural stone tile',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#9a9a8a'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add stone texture
			const tileSize = 60
			for (let y = 0; y < 400; y += tileSize) {
				for (let x = 0; x < 400; x += tileSize) {
					ctx.fillStyle = `rgba(${140 + Math.random() * 30}, ${140 + Math.random() * 30}, ${130 + Math.random() * 30}, 1)`
					ctx.fillRect(x, y, tileSize, tileSize)
					ctx.strokeStyle = '#7a7a6a'
					ctx.strokeRect(x, y, tileSize, tileSize)
				}
			}
		},
	},
]

// Cabinet textures
const cabinetTextures = [
	{
		name: 'cabinet-white',
		description: 'White painted cabinet',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#fafafa'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add subtle texture
			for (let i = 0; i < 100; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				ctx.fillStyle = `rgba(250, 250, 250, ${Math.random() * 0.1})`
				ctx.fillRect(x, y, 2, 2)
			}
		},
	},
	{
		name: 'cabinet-gray',
		description: 'Gray painted cabinet',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#5c5c5c'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add subtle texture
			for (let i = 0; i < 100; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				ctx.fillStyle = `rgba(92, 92, 92, ${Math.random() * 0.1})`
				ctx.fillRect(x, y, 2, 2)
			}
		},
	},
	{
		name: 'cabinet-navy',
		description: 'Navy blue painted cabinet',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#2c3e50'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add subtle texture
			for (let i = 0; i < 100; i++) {
				const x = Math.random() * 400
				const y = Math.random() * 400
				ctx.fillStyle = `rgba(44, 62, 80, ${Math.random() * 0.1})`
				ctx.fillRect(x, y, 2, 2)
			}
		},
	},
	{
		name: 'cabinet-walnut-wood',
		description: 'Walnut wood grain',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#4a3728'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood grain
			for (let i = 0; i < 15; i++) {
				const y = i * 25
				ctx.strokeStyle = `rgba(${60 + Math.random() * 20}, ${40 + Math.random() * 15}, ${25 + Math.random() * 10}, 0.8)`
				ctx.lineWidth = 3
				ctx.beginPath()
				ctx.moveTo(0, y)
				for (let x = 0; x < 400; x += 5) {
					ctx.lineTo(x, y + Math.sin(x / 15) * 4 + Math.random() * 2)
				}
				ctx.stroke()
			}
		},
	},
	{
		name: 'cabinet-oak-wood',
		description: 'Oak wood grain',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#c4a35a'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood grain
			for (let i = 0; i < 15; i++) {
				const y = i * 25
				ctx.strokeStyle = `rgba(${180 + Math.random() * 30}, ${150 + Math.random() * 25}, ${80 + Math.random() * 20}, 0.7)`
				ctx.lineWidth = 3
				ctx.beginPath()
				ctx.moveTo(0, y)
				for (let x = 0; x < 400; x += 5) {
					ctx.lineTo(x, y + Math.sin(x / 20) * 3 + Math.random() * 2)
				}
				ctx.stroke()
			}
		},
	},
]

// Floor textures
const floorTextures = [
	{
		name: 'floor-oak',
		description: 'Oak hardwood floor',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#c4a35a'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood planks
			const plankWidth = 60
			for (let x = 0; x < 400; x += plankWidth) {
				ctx.fillStyle = `hsl(${35 + Math.random() * 5}, ${50 + Math.random() * 10}%, ${60 + Math.random() * 10}%)`
				ctx.fillRect(x, 0, plankWidth, 400)
				
				// Add wood grain
				ctx.strokeStyle = `rgba(${180 + Math.random() * 30}, ${150 + Math.random() * 25}, ${80 + Math.random() * 20}, 0.3)`
				ctx.lineWidth = 1
				for (let y = 0; y < 400; y += 20) {
					ctx.beginPath()
					ctx.moveTo(x, y)
					ctx.lineTo(x + plankWidth, y + Math.sin(y / 30) * 2)
					ctx.stroke()
				}
				
				// Add plank separation
				ctx.strokeStyle = '#a08240'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(x + plankWidth, 0)
				ctx.lineTo(x + plankWidth, 400)
				ctx.stroke()
			}
		},
	},
	{
		name: 'floor-tile-gray',
		description: 'Gray tile floor',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#9e9e9e'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add tile grid
			const tileSize = 50
			ctx.strokeStyle = '#7e7e7e'
			ctx.lineWidth = 2
			for (let y = 0; y < 400; y += tileSize) {
				for (let x = 0; x < 400; x += tileSize) {
					ctx.strokeRect(x, y, tileSize, tileSize)
					// Add subtle variation
					ctx.fillStyle = `rgba(${140 + Math.random() * 20}, ${140 + Math.random() * 20}, ${140 + Math.random() * 20}, 0.3)`
					ctx.fillRect(x, y, tileSize, tileSize)
				}
			}
		},
	},
	{
		name: 'floor-dark-wood',
		description: 'Dark hardwood floor',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#3d2914'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood planks
			const plankWidth = 60
			for (let x = 0; x < 400; x += plankWidth) {
				ctx.fillStyle = `hsl(${25 + Math.random() * 5}, ${60 + Math.random() * 10}%, ${20 + Math.random() * 5}%)`
				ctx.fillRect(x, 0, plankWidth, 400)
				
				// Add wood grain
				ctx.strokeStyle = `rgba(${50 + Math.random() * 20}, ${35 + Math.random() * 15}, ${20 + Math.random() * 10}, 0.4)`
				ctx.lineWidth = 1
				for (let y = 0; y < 400; y += 20) {
					ctx.beginPath()
					ctx.moveTo(x, y)
					ctx.lineTo(x + plankWidth, y + Math.sin(y / 30) * 2)
					ctx.stroke()
				}
				
				// Add plank separation
				ctx.strokeStyle = '#2a1a0d'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(x + plankWidth, 0)
				ctx.lineTo(x + plankWidth, 400)
				ctx.stroke()
			}
		},
	},
	{
		name: 'floor-light-wood',
		description: 'Light hardwood floor',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#e8d4a0'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add wood planks
			const plankWidth = 60
			for (let x = 0; x < 400; x += plankWidth) {
				ctx.fillStyle = `hsl(${40 + Math.random() * 5}, ${40 + Math.random() * 10}%, ${75 + Math.random() * 10}%)`
				ctx.fillRect(x, 0, plankWidth, 400)
				
				// Add wood grain
				ctx.strokeStyle = `rgba(${220 + Math.random() * 20}, ${200 + Math.random() * 20}, ${150 + Math.random() * 20}, 0.3)`
				ctx.lineWidth = 1
				for (let y = 0; y < 400; y += 20) {
					ctx.beginPath()
					ctx.moveTo(x, y)
					ctx.lineTo(x + plankWidth, y + Math.sin(y / 30) * 2)
					ctx.stroke()
				}
				
				// Add plank separation
				ctx.strokeStyle = '#d0b880'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(x + plankWidth, 0)
				ctx.lineTo(x + plankWidth, 400)
				ctx.stroke()
			}
		},
	},
	{
		name: 'floor-stone',
		description: 'Natural stone floor',
		generate: (canvas, ctx) => {
			ctx.fillStyle = '#8a8a7a'
			ctx.fillRect(0, 0, 400, 400)
			
			// Add stone tiles
			const tileSize = 80
			for (let y = 0; y < 400; y += tileSize) {
				for (let x = 0; x < 400; x += tileSize) {
					ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${120 + Math.random() * 40}, ${110 + Math.random() * 40}, 1)`
					ctx.fillRect(x, y, tileSize, tileSize)
					
					// Add texture
					for (let i = 0; i < 20; i++) {
						const tx = x + Math.random() * tileSize
						const ty = y + Math.random() * tileSize
						ctx.fillStyle = `rgba(${100 + Math.random() * 30}, ${100 + Math.random() * 30}, ${90 + Math.random() * 30}, 0.5)`
						ctx.fillRect(tx, ty, 3, 3)
					}
					
					ctx.strokeStyle = '#6a6a5a'
					ctx.lineWidth = 2
					ctx.strokeRect(x, y, tileSize, tileSize)
				}
			}
		},
	},
]

async function generateTexture(texture) {
	const canvas = createCanvas(400, 400)
	const ctx = canvas.getContext('2d')
	
	texture.generate(canvas, ctx)
	
	const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
	const filePath = path.join(texturesDir, `${texture.name}.jpg`)
	fs.writeFileSync(filePath, buffer)
	console.log(`Generated: ${texture.name} - ${texture.description}`)
}

async function generateAllTextures() {
	console.log('Generating texture images...\n')
	
	console.log('Countertops:')
	for (const texture of countertopTextures) {
		await generateTexture(texture)
	}
	
	console.log('\nBacksplash:')
	for (const texture of backsplashTextures) {
		await generateTexture(texture)
	}
	
	console.log('\nCabinets:')
	for (const texture of cabinetTextures) {
		await generateTexture(texture)
	}
	
	console.log('\nFloors:')
	for (const texture of floorTextures) {
		await generateTexture(texture)
	}
	
	console.log('\n✅ All textures generated!')
}

// Check if canvas is available
try {
	require('canvas')
	generateAllTextures().catch(console.error)
} catch (error) {
	console.error('Error: canvas package not found. Install it with: npm install canvas')
	console.error('Alternatively, you can add your own texture images to public/textures/')
	process.exit(1)
}
