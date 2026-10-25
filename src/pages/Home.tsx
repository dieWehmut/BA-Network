import { useEffect, useState } from 'react'
import '../styles/Console.css'
import '../styles/Home.css'
import NetworkGraph from '../components/NetworkGraph'
import DegreeHistogram from '../components/DegreeHistogram'
import ControlsPanel from '../components/ControlsPanel'
import Footer from '../components/Footer'
import ConsoleHeader from '../components/ConsoleHeader'
import ConsoleSection from '../components/ConsoleSection'
import ConsoleStrip from '../components/ConsoleStrip'
import { computeNetworkStats } from '../utils/stats'
import { applyTheme, getTheme, toggleTheme, type Theme } from '../utils/theme'
import type { Node as BANode, Link as BALink } from '../utils/ba'

const REPO_URL = 'https://github.com/dieWehmut/BA-Network'

export default function Home() {
  // increase defaults so graphs are denser by default
  const [initialNodes, setInitialNodes] = useState(10)
  const [attachPerStep, setAttachPerStep] = useState(3)
  const [steps, setSteps] = useState(150)
  const [generationId, setGenerationId] = useState(0)
  const [pauseSignal, setPauseSignal] = useState(0)
  const [resumeSignal, setResumeSignal] = useState(0)
  const [speed, setSpeed] = useState(300)

  const [nodes, setNodes] = useState<BANode[]>([])
  const [links, setLinks] = useState<BALink[]>([])
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState('idle')
  const [theme, setTheme] = useState<Theme>(() => getTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const stats = computeNetworkStats(nodes, links)

  return (
    <div className="console-shell">
      <ConsoleHeader
        theme={theme}
        onToggleTheme={() => setTheme((current) => toggleTheme(current))}
        repoUrl={REPO_URL}
      />

      <section className="console-overview" aria-label="Network overview">
        <div className="console-overview__stage">
          <NetworkGraph
            initialNodes={initialNodes}
            attachPerStep={attachPerStep}
            steps={steps}
            generationId={generationId}
            pauseSignal={pauseSignal}
            resumeSignal={resumeSignal}
            tickDelay={speed}
            onNodesUpdate={(ns, ls) => {
              setNodes(ns)
              setLinks(ls)
            }}
            onProgress={(currentStep, totalSteps, nextStatus) => {
              setStep(Math.min(currentStep, totalSteps))
              setStatus(nextStatus)
            }}
            width={720}
            height={360}
          />
        </div>

        <div className="console-overview__dashboard">
          <ConsoleSection
            title="LINKS"
            rows={[
              { label: 'github', value: <a href={REPO_URL} target="_blank" rel="noreferrer">{REPO_URL.replace('https://', '')}</a> },
              { label: 'model', value: 'Barabási–Albert' },
              { label: 'attach', value: `m = ${attachPerStep}` },
            ]}
          />
          <ConsoleSection
            title="CONTENT"
            stats={[
              { label: 'Nodes', value: stats.nodes },
              { label: 'Links', value: stats.links },
              { label: 'Avg deg', value: stats.avgDegree },
              { label: 'Max deg', value: stats.maxDegree },
              { label: 'Density', value: stats.density.toFixed(4) },
              { label: 'Components', value: stats.components },
            ]}
          />
          <ConsoleSection
            title="RUNTIME"
            rows={[
              { label: 'step', value: `${step} / ${steps}` },
              { label: 'status', value: status },
              { label: 'speed', value: `${speed} ms` },
              { label: 'top', value: stats.topNodes.map((t) => `${t.id}(${t.degree})`).join(', ') || '—' },
            ]}
          />
        </div>
      </section>

      <div className="console-main">
        <div className="console-panel">
          <div className="console-panel__title">DEGREE DISTRIBUTION</div>
          <DegreeHistogram nodes={nodes} links={links} width={720} height={280} />
        </div>
        <div className="console-panel">
          <ControlsPanel
            initialNodes={initialNodes}
            attachPerStep={attachPerStep}
            steps={steps}
            onChange={(patch) => {
              if (patch.initialNodes !== undefined) setInitialNodes(patch.initialNodes)
              if (patch.attachPerStep !== undefined) setAttachPerStep(patch.attachPerStep)
              if (patch.steps !== undefined) setSteps(patch.steps)
            }}
            onGenerate={() => setGenerationId((id) => id + 1)}
            onReset={() => {
              setInitialNodes(10)
              setAttachPerStep(3)
              setSteps(150)
              setGenerationId((id) => id + 1)
            }}
            onPause={() => setPauseSignal((s) => s + 1)}
            onResume={() => setResumeSignal((s) => s + 1)}
            speed={speed}
            onSpeedChange={(v) => setSpeed(v)}
          />
        </div>
      </div>

      <ConsoleStrip
        command="ba-network"
        tokens={['console', theme, `m=${attachPerStep}`, `speed=${speed}ms`]}
        hint={`status: ${status}`}
      />

      <Footer repoUrl={REPO_URL} />
    </div>
  )
}