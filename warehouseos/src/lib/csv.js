// Minimal, dependency-free CSV import/export helpers.

export function toCSV(rows, columns) {
  if (!rows || rows.length === 0) {
    const header = columns.map((c) => c.label).join(',')
    return header + '\n'
  }
  const cols = columns || Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
  const escape = (val) => {
    const s = val === null || val === undefined ? '' : String(val)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const header = cols.map((c) => escape(c.label)).join(',')
  const body = rows
    .map((r) => cols.map((c) => escape(r[c.key])).join(','))
    .join('\n')
  return header + '\n' + body + '\n'
}

export function downloadCSV(filename, rows, columns) {
  const csv = toCSV(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Parse CSV text into an array of objects using the first row as headers.
export function parseCSV(text) {
  const rows = []
  let i = 0
  const readField = () => {
    const buf = []
    if (text[i] === '"') {
      i++ // skip opening quote
      while (i < text.length) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            buf.push('"')
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          buf.push(text[i])
          i++
        }
      }
    } else {
      while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
        buf.push(text[i])
        i++
      }
    }
    return buf.join('')
  }
  const readRow = () => {
    const fields = []
    while (i < text.length) {
      fields.push(readField())
      if (text[i] === ',') {
        i++
        continue
      }
      if (text[i] === '\n') {
        i++
        break
      }
      if (text[i] === '\r') {
        i++
        if (text[i] === '\n') i++
        break
      }
      if (i >= text.length) break
    }
    return fields
  }
  const header = readRow()
  if (header.length === 0) return []
  while (i < text.length) {
    const row = readRow()
    if (row.length === 1 && row[0] === '') continue
    const obj = {}
    header.forEach((h, idx) => {
      obj[h.trim()] = (row[idx] || '').trim()
    })
    rows.push(obj)
  }
  return rows
}
