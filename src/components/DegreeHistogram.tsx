import { useMemo } from 'react'
import '../styles/DegreeHistogram.css'
import type { Node as BANode, Link as BALink } from '../utils/ba'

type Props = {
  nodes: BANode[]
  links: BALink[]
  width?: number
  height?: number
}

export default function DegreeHistogram({ nodes, links, width = 360, height = 240 }: Props) {
  const degreeCounts = useMemo(() => {
    const deg: Record<number, number> = {}
    nodes.forEach((n) => (deg[n.id] = 0))
    links.forEach((l) => {
      deg[l.source] = (deg[l.source] || 0) + 1
      deg[l.target] = (deg[l.target] || 0) + 1
    })
    const counts: Record<number, number> = {}
    Object.values(deg).forEach((d) => (counts[d] = (counts[d] || 0) + 1))
    // transform to sorted array of [degree, count]
    const arr = Object.entries(counts).map(([k, v]) => ({ degree: Number(k), count: v }))
    arr.sort((a, b) => a.degree - b.degree)
    return arr
  }, [nodes, links])
  const maxCount = degreeCounts.length ? Math.max(1, ...degreeCounts.map((d) => d.count)) : 1

  const pad = 24
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  if (!nodes || nodes.length === 0) {
    return (
      <div className="degree-histogram" style={{ width, height, border: '1px solid #eee', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666' }}>No data</div>
      </div>
    )
  }

  return (
    <div className="degree-histogram" style={{ width, height, padding: 6 }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="histGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#69b3a2" stopOpacity="1" />
            <stop offset="100%" stopColor="#2b8c7a" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad},${pad})`}>
          {degreeCounts.length === 0 ? (
            <text x={innerW / 2} y={innerH / 2} textAnchor="middle" fill="#666">
              No degree data
            </text>
          ) : (
            degreeCounts.map((d, i) => {
              const barW = innerW / Math.max(1, degreeCounts.length)
              const barH = (d.count / maxCount) * innerH
              const x = i * barW
              const y = innerH - barH
              return (
                <g key={d.degree}>
                  <rect x={x + 2} y={y} width={Math.max(2, barW - 4)} height={barH} fill="#69b3a2">
                    <title>{`degree ${d.degree}: ${d.count}`}</title>
                  </rect>
                  <text x={x + barW / 2} y={y - 6} fontSize={11} textAnchor="middle" fill="#333">
                    {d.count}
                  </text>
                  <text x={x + barW / 2} y={innerH + 12} fontSize={10} textAnchor="middle" fill="#333">
                    {d.degree}
                  </text>
                </g>
              )
            })
          )}
        </g>
      </svg>
      <div style={{ fontSize: 12, marginTop: 6 }}>Degree distribution (degree: count)</div>
    </div>
  )
}
