# Generate Texture Images

The texture images need to be generated before they will appear in the UI. Here are two easy ways to do it:

## Option 1: Browser-Based Generator (Recommended - No Installation)

1. Open `scripts/generate-textures.html` in your web browser
2. Click the **"Generate All Textures"** button
3. Click **"Download All"** button to download all texture images
4. Move all downloaded `.jpg` files to `public/textures/` folder

## Option 2: Node.js Script

1. Install the canvas package:
   ```bash
   npm install canvas
   ```

2. Run the generator:
   ```bash
   node scripts/generate-textures.js
   ```

   This will automatically create all texture images in `public/textures/`

## After Generating

Once the images are in `public/textures/`, restart your dev server:

```bash
npm run dev
```

The texture images should now appear in the UI menu.

## Troubleshooting

- **Images still not showing?** Check the browser console (F12) for any error messages
- **404 errors?** Make sure images are in `public/textures/` (not `src/textures/` or `dist/textures/`)
- **Wrong paths?** Verify the texture filenames match exactly what's in `public/content/textures.json`
