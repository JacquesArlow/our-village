import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, normalize } from 'node:path'

const MAX_PDF_BYTES = 12 * 1024 * 1024

function storageRoot() {
  return process.env.UPLOADS_DIR || (process.env.NODE_ENV === 'production' ? '/data/uploads' : join(process.cwd(), '.data/uploads'))
}

export function safeFileName(name: string) {
  const trimmed = name.trim() || 'form.pdf'
  const base = trimmed.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-')
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

export function assertPdf(file: File) {
  const name = file.name || ''
  const type = file.type || 'application/pdf'
  if (!name.toLowerCase().endsWith('.pdf') && type !== 'application/pdf') {
    throw createError({ statusCode: 400, statusMessage: 'Please upload a PDF file.' })
  }
  if (file.size > MAX_PDF_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'PDF must be smaller than 12 MB.' })
  }
}

export async function storePdf(file: File, folder: string) {
  assertPdf(file)
  const fileName = safeFileName(file.name)
  const storedName = `${crypto.randomUUID()}-${fileName}`
  const relativePath = `${folder}/${storedName}`
  const absoluteDir = join(storageRoot(), folder)
  const absolutePath = join(storageRoot(), relativePath)
  await mkdir(absoluteDir, { recursive: true })
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()))
  return {
    fileName,
    filePath: relativePath,
    fileMime: file.type || 'application/pdf',
    fileSize: file.size
  }
}

export async function readStoredFile(relativePath: string) {
  const root = storageRoot()
  const absolutePath = normalize(join(root, relativePath))
  const normalizedRoot = normalize(root)
  if (!absolutePath.startsWith(normalizedRoot)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path.' })
  }
  return await readFile(absolutePath)
}

export function downloadHeaders(fileName: string, fileMime = 'application/pdf') {
  const safeName = safeFileName(fileName).replace(/"/g, '')
  return {
    'Content-Type': fileMime,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'private, max-age=0, must-revalidate'
  }
}
