// Copies the pipeline's JSON output (../../data) into public/data so the
// dev server and the build can fetch it as static assets. Run automatically
// before `dev` and `build` - the pipeline itself is never touched here.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const sourceDir = join(here, '..', '..', 'data')
const destDir = join(here, '..', 'public', 'data')

const files = ['schemes.json', 'monthly_recognized.json', 'dataquality_log.json']

mkdirSync(destDir, { recursive: true })

for (const file of files) {
  const src = join(sourceDir, file)
  const dest = join(destDir, file)
  if (!existsSync(src)) {
    console.warn(`sync-data: ${file} not found in ${sourceDir}, skipping`)
    continue
  }
  copyFileSync(src, dest)
  console.log(`sync-data: copied ${file}`)
}
