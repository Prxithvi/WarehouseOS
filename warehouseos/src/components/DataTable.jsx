import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { classNames, formatNumber } from '../lib/format'
import { EmptyState } from './ui'

/**
 * Generic, sortable, paginated table.
 * columns: [{ key, header, render?(row), sortable?, align?, className?, width? }]
 */
export function DataTable({
  columns,
  data,
  pageSize = 10,
  initialSort,
  emptyTitle = 'No records',
  emptyDescription,
  onRowClick,
  rowKey = (r) => r.id,
}) {
  const [sort, setSort] = useState(
    initialSort ? { key: initialSort.key, dir: initialSort.dir || 'asc' } : null
  )
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return data
    const getVal = (row) => (col.sortValue ? col.sortValue(row) : row[col.key])
    return [...data].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.dir === 'asc' ? va - vb : vb - va
      }
      return sort.dir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [data, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (col) => {
    if (!col.sortable) return
    setSort((s) => {
      if (s?.key === col.key) return { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      return { key: col.key, dir: 'asc' }
    })
    setPage(1)
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-os-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={classNames(
                    'px-4 py-3 text-xs font-semibold text-os-muted uppercase tracking-wide text-left whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-os-text'
                  )}
                  onClick={() => toggleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="opacity-60">
                        {sort?.key === col.key ? (
                          sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={classNames(
                  'border-b border-os-border/60 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-os-bg/60'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={classNames(
                      'px-4 py-3 text-os-text align-middle',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-os-muted text-xs">
            {formatNumber((currentPage - 1) * pageSize + 1)}–{formatNumber(Math.min(currentPage * pageSize, sorted.length))} of {formatNumber(sorted.length)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="os-btn-ghost p-1.5 rounded-md disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-os-muted px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="os-btn-ghost p-1.5 rounded-md disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
