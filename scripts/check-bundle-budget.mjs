import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const distAssetsDir = join(process.cwd(), 'dist', 'assets')

if (!existsSync(distAssetsDir)) {
  console.error('[bundle-budget] No existe dist/assets. Ejecuta primero: bun run build')
  process.exit(1)
}

const assetFiles = readdirSync(distAssetsDir).filter((file) => file.endsWith('.js') || file.endsWith('.css'))

if (assetFiles.length === 0) {
  console.error('[bundle-budget] No se encontraron assets JS/CSS para evaluar.')
  process.exit(1)
}

const metrics = assetFiles.map((file) => {
  const filePath = join(distAssetsDir, file)
  const rawBytes = statSync(filePath).size
  const gzipBytes = gzipSync(readFileSync(filePath), { level: 9 }).length
  return {
    file,
    rawBytes,
    gzipBytes,
    ext: file.endsWith('.css') ? 'css' : 'js',
  }
})

const entryJs = findByPattern(metrics, /^index-.*\.js$/)
const entryCss = findByPattern(metrics, /^index-.*\.css$/)
const jsChunks = metrics.filter((item) => item.ext === 'js')
const largestJs = [...jsChunks].sort((a, b) => b.rawBytes - a.rawBytes)[0]

const checks = [
  { label: 'Entry JS (raw)', file: entryJs?.file, value: entryJs?.rawBytes, limitBytes: 120 * 1024 },
  { label: 'Entry JS (gzip)', file: entryJs?.file, value: entryJs?.gzipBytes, limitBytes: 40 * 1024 },
  { label: 'Entry CSS (raw)', file: entryCss?.file, value: entryCss?.rawBytes, limitBytes: 50 * 1024 },
  { label: 'Entry CSS (gzip)', file: entryCss?.file, value: entryCss?.gzipBytes, limitBytes: 12 * 1024 },
  { label: 'Largest JS chunk (raw)', file: largestJs?.file, value: largestJs?.rawBytes, limitBytes: 520 * 1024 },
  { label: 'Largest JS chunk (gzip)', file: largestJs?.file, value: largestJs?.gzipBytes, limitBytes: 160 * 1024 },
]

const failures = []

console.log('[bundle-budget] Resultado de chequeo:')
for (const check of checks) {
  if (!check.file || typeof check.value !== 'number') {
    failures.push(`${check.label}: archivo objetivo no encontrado`)
    continue
  }

  const passes = check.value <= check.limitBytes
  const status = passes ? 'OK  ' : 'FAIL'
  console.log(
    `- ${status} ${check.label}: ${formatKiB(check.value)} / limite ${formatKiB(check.limitBytes)} (${check.file})`,
  )

  if (!passes) {
    failures.push(`${check.label}: ${formatKiB(check.value)} > ${formatKiB(check.limitBytes)} (${check.file})`)
  }
}

if (failures.length > 0) {
  console.error('\n[bundle-budget] Se superaron limites:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('\n[bundle-budget] Todos los budgets fueron respetados.')

function findByPattern(list, pattern) {
  return list.find((item) => pattern.test(item.file))
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`
}
