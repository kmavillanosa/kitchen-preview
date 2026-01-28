import fs from 'fs'
import path from 'path'

const base64Path = path.join(process.cwd(), 'public', 'scenes', 'preview.base64')
const outputPath = path.join(process.cwd(), 'public', 'scenes', 'kitchen-real.jpg')

try {
	const base64Data = fs.readFileSync(base64Path, 'utf8')
	// Remove data URL prefix if present
	const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')
	const buffer = Buffer.from(base64, 'base64')
	fs.writeFileSync(outputPath, buffer)
	console.log('Converted base64 to image:', outputPath)
} catch (error) {
	console.error('Error converting base64:', error)
	process.exit(1)
}
