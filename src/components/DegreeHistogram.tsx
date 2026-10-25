import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import '../styles/DegreeHistogram.css'
import { computeNetworkStats } from '../utils/stats'
import type { Node as BANode, Link as BALink } from '../utils/ba'

type Props = {
  nodes: BANode[]
  links: BALink[]
}

/**
 * Degree distribution chart. Bars use the console accent colour and labels are
 * monospace. The chart measures its box so the type stays at real pixel sizes
 * instead of being scaled down with the viewBox.
 */
export default function DegreeHistogram({ nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const plotRef = useRef<HTMLDivElement | null>(null)

  const [box, setBox] = useState({ w: 640, h: 240 })
  useEffect(() => {
    const el = plotRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setBox({ w: Math.max(240, Math.round(rect.width)), h: Math.max(160, Math.round(rect.height)) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stats = useMemo(() => computeNetworkStats(nodes, links), [nodes, links])
  const { degreeCounts, nodes: totalNodes, links: totalLinks } = stats
  const maxCount = degreeCounts.length ? Math.max(1, ...degreeCounts.map((d) => d.count)) : 1

  // d3 zoom lets the reader inspect dense distributions.
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoomLayer = svg.select('g.zoom-layer')
    if (zoomLayer.empty()) return

    // The bundled d3 shim is untyped, so describe just the shape we touch.
    const zoom = d3
      .zoom()
      .on('zoom', (event: { transform: { toString(): string } }) => {
        zoomLayer.attr('transform', event.transform.toString())
      })

    const svgNode = svg.node() as unknown as { __hasZoom?: boolean }
    if (!svgNode.__hasZoom) {
      svg.call(zoom)
      svgNode.__hasZoom = true
    }
  }, [svgRef, degreeCounts.length])

  const width = box.w
  const height = box.h
  const padX = 18
  const padTop = 16
  const bottomLabelSpace = 24
  const innerW = Math.max(40, width - padX * 2)
  const innerH = Math.max(40, height - padTop - bottomLabelSpace)

  if (!nodes || nodes.length === 0) {
    return (
      <div className="degree-histogram" ref={wrapRef}>
        <div className="degree-histogram__empty">No data — press Generate to build a network</div>
      </div>
    )
  }

  // Thin out degree labels so they never collide on a narrow box.
  const labelEvery = Math.max(1, Math.ceil(degreeCounts.length / Math.max(3, Math.floor(innerW / 42))))

  return (
    <div className="degree-histogram" ref={wrapRef}>
      {/* Summary sits above the plot so it never covers the bars. */}
      <div className="hist-info" aria-hidden>
        <span className="hist-info__item">
          nodes <strong>{totalNodes}</strong>
        </span>
        <span className="hist-info__item">
          links <strong>{totalLinks}</strong>
        </span>
        <span className="hist-info__item">
          max <strong>{stats.maxDegree}</strong>
        </span>
        <span className="hist-info__item">
          avg <strong>{stats.avgDegree}</strong>
        </span>
        <span className="hist-info__item">
          mode <strong>{stats.modeDegree}</strong>
        </span>
        <span className="hist-info__item">
          median <strong>{stats.medianDegree}</strong>
        </span>
        <span className="hist-info__item">
          ≥5 <strong>{stats.pctGE5}%</strong>
        </span>
      </div>
      <div className="degree-histogram__plot" ref={plotRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Degree distribution histogram"
        >
        <g className="zoom-layer">
          <g transform={`translate(${padX},${padTop})`}>
            {degreeCounts.length === 0 ? (
              <text x={innerW / 2} y={innerH / 2} textAnchor="middle" className="hist-degree">
                No degree data
              </text>
            ) : (
              degreeCounts.map((bucket, i) => {
                const barW = innerW / Math.max(1, degreeCounts.length)
                const barH = (bucket.count / maxCount) * innerH
                const x = i * barW
                const y = innerH - barH
                return (
                  <g key={bucket.degree}>
                    <rect x={x + 1} y={y} width={Math.max(2, barW - 2)} height={barH}>
                      <title>{`degree ${bucket.degree}: ${bucket.count}`}</title>
                    </rect>
                    <text
                      className="hist-count"
                      x={x + barW / 2}
                      y={Math.max(11, y - 4)}
                      textAnchor="middle"
                      fontSize={10.5}
                    >
                      {bucket.count}
                    </text>
                    {i % labelEvery === 0 && (
                      <text
                        className="hist-degree"
                        x={x + barW / 2}
                        y={innerH + 15}
                        textAnchor="middle"
                        fontSize={10}
                      >
                        {bucket.degree}
                      </text>
                    )}
                  </g>
                )
              })
            )}
            {/* Baseline last so it stays crisp above the bars. */}
            <line
              x1={0}
              y1={innerH}
              x2={innerW}
              y2={innerH}
              stroke="var(--console-hairline)"
              strokeWidth={1}
            />
            </g>
          </g>
        </svg>
      </div>
      <div className="degree-histogram__caption">Degree distribution (degree: count)</div>
    </div>
  )
}
