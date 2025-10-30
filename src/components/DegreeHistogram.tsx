import { useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import '../styles/DegreeHistogram.css'
import type { Node as BANode, Link as BALink } from '../utils/ba'

type Props = {
  nodes: BANode[]
  links: BALink[]
  width?: number
  height?: number
}

export default function DegreeHistogram({ nodes, links, width = 360, height = 240 }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // set up d3 zoom on the svg; keep overlay (HTML) out of the svg so it won't be zoomed
  useEffect(() => {
    if (!svgRef.current) return
  const svg = d3.select(svgRef.current)
    const zoomLayer = svg.select('g.zoom-layer')
    if (zoomLayer.empty()) return

    const zoom: any = d3.zoom().on('zoom', (event: any) => {
      // apply transform to the zoom-layer's inner group
      zoomLayer.attr('transform', event.transform.toString())
    })

    // only bind zoom once
    const _svgAny = svg.node() as unknown as { __hasZoom?: boolean }
    if (!_svgAny.__hasZoom) {
  svg.call(zoom)
      _svgAny.__hasZoom = true
    }

    return () => {
      try {
        // unbind? d3 doesn't provide a simple uncall, so we leave it bound
      } catch (err) {
        void err
      }
    }
  }, [svgRef])
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
  const totalNodes = nodes.length
  const totalLinks = links.length
  const avgDegree = totalNodes ? Number(((totalLinks * 2) / totalNodes).toFixed(2)) : 0
  const maxDegree = degreeCounts.length ? Math.max(...degreeCounts.map((d) => d.degree)) : 0

  // use separate horizontal and vertical padding so we don't over-reserve vertical space
  const padX = 24
  const padY = 12

  // compute responsive font sizes based on overall height (used to reserve bottom label space)
  const countFont = Math.max(13, Math.round(height * 0.07))
  const degreeFont = Math.max(12, Math.round(height * 0.055))
  const bottomLabelSpace = Math.max(18, degreeFont + 8)

  const innerW = width - padX * 2
  // reserve some vertical space for top/bottom padding and bottom labels so bars sit near bottom
  const innerH = height - padY * 2 - bottomLabelSpace

  // compute additional stats: mode and median and percent >= threshold
  const modeDegree = degreeCounts.length ? degreeCounts.reduce((acc, cur) => (cur.count > (acc.count || 0) ? cur : acc), { degree: 0, count: 0 }).degree : 0
  // median: find cumulative
  let medianDegree = 0
  if (degreeCounts.length) {
    const total = degreeCounts.reduce((s, d) => s + d.count, 0)
    let cum = 0
    for (const d of degreeCounts) {
      cum += d.count
      if (cum >= total / 2) {
        medianDegree = d.degree
        break
      }
    }
  }
  const pctGE5 = degreeCounts.length ? Math.round((degreeCounts.filter((d) => d.degree >= 5).reduce((s, d) => s + d.count, 0) / Math.max(1, totalNodes)) * 100) : 0

  if (!nodes || nodes.length === 0) {
    return (
      <div className="degree-histogram" style={{ width: '100%', maxWidth: width, height, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666' }}>No data</div>
      </div>
    )
  }

  return (
    <div className="degree-histogram" style={{ width: '100%', maxWidth: width, height, padding: 6, position: 'relative' }}>
      {/* HTML overlay placed above the SVG so it doesn't interfere with SVG coords */}
      <div className="hist-info-overlay" aria-hidden>
        <div className="hist-info-title">Nodes: {totalNodes}</div>
        <div className="hist-info-line">Links: {totalLinks}</div>
        <div className="hist-info-line">Max deg: {maxDegree}  Avg: {avgDegree}</div>
        <div className="hist-info-line">Mode: {modeDegree}  Median: {medianDegree}  ≥5: {pctGE5}%</div>
      </div>
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="histGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#69b3a2" stopOpacity="1" />
            <stop offset="100%" stopColor="#2b8c7a" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* zoom-layer will receive transform from d3.zoom; inner group applies padding */}
        <g className="zoom-layer">
          <g transform={`translate(${padX},${padY})`}>
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
                  <text className="hist-count" x={x + barW / 2} y={Math.max(countFont + 4, y - 8)} fontSize={countFont} textAnchor="middle" fill="#0f1720" style={{ fontWeight: 700 }}>
                    {d.count}
                  </text>
                  <text className="hist-degree" x={x + barW / 2} y={innerH + Math.max(12, degreeFont + 4)} fontSize={degreeFont} textAnchor="middle" fill="#111" style={{ fontWeight: 600 }}>
                    {d.degree}
                  </text>
                </g>
              )
            })
          )}
          </g>
        </g>
      </svg>
      <div style={{ fontSize: 12, marginTop: 6 }}>Degree distribution (degree: count)</div>
    </div>
  )
}
