import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import generateBASnapshots from '../utils/ba'
import type { Node as BANode, Link as BALink } from '../utils/ba'
import '../styles/NetworkGraph.css'

type Props = {
  initialNodes: number
  attachPerStep: number
  steps: number
  generationId: number
  onNodesUpdate?: (nodes: BANode[], links: BALink[]) => void
  width?: number
  height?: number
  stopSignal?: number
  pauseSignal?: number
  resumeSignal?: number
  tickDelay?: number
}

export default function NetworkGraph({
  initialNodes,
  attachPerStep,
  steps,
  generationId,
  onNodesUpdate,
  width = 720,
  height = 480,
  stopSignal,
  pauseSignal,
  resumeSignal,
  tickDelay,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [nodes, setNodes] = useState<BANode[]>([])
  const [links, setLinks] = useState<BALink[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<any | null>(null)
  const stepIndexRef = useRef<number>(0)
  const snapshotsRef = useRef<any[] | null>(null)

  const startTimer = (delay: number) => {
    if (timerRef.current) {
      try { timerRef.current.stop() } catch (err) { void err }
      timerRef.current = null
    }
    const t = d3.interval(() => {
      const snaps = snapshotsRef.current || []
      const idx = stepIndexRef.current
      if (idx >= snaps.length) {
        t.stop()
        timerRef.current = null
        setIsAnimating(false)
        return
      }
      const snap = snaps[idx]
      setNodes(snap.nodes)
      setLinks(snap.links)
      if (onNodesUpdate) onNodesUpdate(snap.nodes, snap.links)
      stepIndexRef.current = idx + 1
    }, delay)
    timerRef.current = t
  }
  useEffect(() => {
    // when generationId or params change, regenerate and animate
    const snapshots = generateBASnapshots(initialNodes, attachPerStep, steps)
    snapshotsRef.current = snapshots

    // initial nodes/links
    const initialNodesArr = snapshots.length ? snapshots[0].nodes.slice(0, initialNodes) : Array.from({ length: initialNodes }).map((_, i) => ({ id: i }))
    const initialLinksArr: any[] = []
    setNodes(initialNodesArr)
    setLinks(initialLinksArr)
    if (onNodesUpdate) onNodesUpdate(initialNodesArr, initialLinksArr)

    stepIndexRef.current = 0
    setIsAnimating(true)

    const delay = typeof tickDelay === 'number' ? tickDelay : 600
    startTimer(delay)

    return () => {
      try { if (timerRef.current) timerRef.current.stop() } catch (err) { void err }
      timerRef.current = null
      setIsAnimating(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId, initialNodes, attachPerStep, steps])
  // external stop signal: stop the ongoing generation immediately
  useEffect(() => {
    if (typeof stopSignal === 'number') {
      if (timerRef.current) {
        try { timerRef.current.stop() } catch (err) { void err }
        timerRef.current = null
      }
      setIsAnimating(false)
    }
  }, [stopSignal])

  useEffect(() => {
    if (typeof pauseSignal === 'number') {
      if (timerRef.current) {
        try { timerRef.current.stop() } catch (err) { void err }
        timerRef.current = null
      }
      setIsAnimating(false)
    }
  }, [pauseSignal])

  useEffect(() => {
    if (typeof resumeSignal === 'number') {
      const snaps = snapshotsRef.current || []
      if (stepIndexRef.current < snaps.length && timerRef.current == null) {
        const delay = typeof tickDelay === 'number' ? tickDelay : 600
        startTimer(delay)
        setIsAnimating(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSignal, tickDelay])

  // allow changing speed (tickDelay) during an active generation: restart timer with new delay
  useEffect(() => {
    const snaps = snapshotsRef.current || []
    const delay = typeof tickDelay === 'number' ? tickDelay : 600
    // if a timer is active, restart it with the new delay
    if (timerRef.current) {
      try {
        timerRef.current.stop()
      } catch (err) {
        void err
      }
      timerRef.current = null
      // only restart if we still have remaining snapshots
      if (stepIndexRef.current < snaps.length) {
        startTimer(delay)
      }
    } else if (isAnimating && stepIndexRef.current < snaps.length) {
      // if we're in animating state but timer isn't present (edge case), start it
      startTimer(delay)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickDelay])

  // D3 force layout
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
  // preserve current zoom transform so user zoom/translate isn't lost when we re-render
  let prevTransform: any = null
    try {
      prevTransform = d3.zoomTransform(svg.node() as any)
    } catch (err) {
      prevTransform = null
      void err
    }
    svg.selectAll('*').remove()

    // container holds links + nodes so we can apply transform to it
    const container = svg.append('g').attr('class', 'container')
    container.append('g').attr('class', 'links')
    container.append('g').attr('class', 'nodes')

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(40))
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
    // make layout settle faster
    simulation.alphaDecay(0.06)

    const link = svg
      .select('.links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)

    const degreeMap: Record<number, number> = {}
    links.forEach((l) => {
      degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
      degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
    })

    const node = svg
      .select('.nodes')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => 4 + (degreeMap[(d as any).id] || 0))
      .attr('fill', (d: any) => ((degreeMap[(d as any).id] && degreeMap[(d as any).id] > 4) ? '#d62728' : '#1f77b4'))
      .call(
        d3
          .drag()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            ;(d as any).fx = (d as any).x
            ;(d as any).fy = (d as any).y
          })
          .on('drag', (event: any, d: any) => {
            ;(d as any).fx = event.x
            ;(d as any).fy = event.y
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            ;(d as any).fx = null
            ;(d as any).fy = null
          }),
      )

  node.append('title').text((d: any) => `ID: ${(d as any).id}\ndeg: ${degreeMap[(d as any).id] || 0}`)

    simulation.nodes(nodes as any).on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as any).x)
        .attr('y1', (d: any) => (d.source as any).y)
        .attr('x2', (d: any) => (d.target as any).x)
        .attr('y2', (d: any) => (d.target as any).y)

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)
    })

    ;(simulation.force('link') as any).links(links)

    // control simulation running: if we're not animating new nodes, stop shortly after layout stabilizes
    if (isAnimating) {
      // give the layout energy while animating
      simulation.alpha(0.3).restart()
    } else {
      // allow a short settle then stop simulation so nodes freeze and stop moving
      simulation.alpha(0.001)
      // stop after a brief timeout to let last tick apply
      const stopTimer = setTimeout(() => {
        try {
          simulation.stop()
        } catch (err) {
          void err
        }
      }, 300)
      // ensure cleanup of this timer on effect cleanup
      ;(simulation as any).__stopTimer = stopTimer
    }

    // zoom: apply transform to container group, and restore previous transform if present
    const zoom = d3.zoom().on('zoom', (event: any) => {
      container.attr('transform', event.transform.toString())
    })
    svg.call(zoom as any)
    if (prevTransform) {
      try {
        svg.call((zoom as any).transform, prevTransform)
      } catch (err) {
        // best-effort restore
        void err
      }
    }

    return () => {
      try {
        // clear any stop timer
        const st = (simulation as any).__stopTimer
        if (st) clearTimeout(st)
      } catch (err) {
        void err
      }
      simulation.stop()
    }
  }, [nodes, links, isAnimating, width, height])

  return (
    <div className="network-graph" style={{ width, height, border: '1px solid #ddd' }}>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  )
}
