import { useState } from 'react'
import Header from '../components/Header'
import ScoreBadge from '../components/ScoreBadge'

const SUBMISSIONS = [
  { id:'sub-001', student:'Alice Johnson',  ai:84, teacher:null, assignment:'Social Media Essay' },
  { id:'sub-002', student:'Bob Martinez',   ai:52, teacher:58,   assignment:'Social Media Essay' },
  { id:'sub-003', student:'Chloe Thompson', ai:91, teacher:null, assignment:'Social Media Essay' },
  { id:'sub-004', student:'David Kim',      ai:67, teacher:70,   assignment:'WWI Analysis' },
  { id:'sub-005', student:'Emma Wilson',    ai:78, teacher:null, assignment:'WWI Analysis' },
]

const TRAITS = ['Grammar','Coherence','Vocabulary','Argument Strength','Style']

export default function TeacherCalibration() {
  const [selected, setSelected] = useState(SUBMISSIONS[0])
  const [overrides, setOverrides] = useState({})
  const [saved, setSaved] = useState(false)

  const aiTraitScores = { Grammar:88, Coherence:90, Vocabulary:82, 'Argument Strength':85, Style:75 }

  function handleOverride(trait, val) {
    setOverrides(prev => ({ ...prev, [trait]: Number(val) }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const traitColors = { Grammar:'#10b981', Coherence:'#6366f1', Vocabulary:'#22d3ee', 'Argument Strength':'#f59e0b', Style:'#a855f7' }

  return (
    <>
      <Header title="Teacher Calibration Tool" subtitle="Review, adjust, and override AI-generated scores" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">⚖️ Teacher Calibration</h1>
        <p className="page-sub">Compare AI scores with your professional judgment. Override individual trait scores as needed.</p>

        {saved && <div className="alert alert-success">✅ Calibration saved successfully!</div>}

        <div className="grid-2">
          {/* Submission List */}
          <div>
            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color:'var(--text-muted)' }}>SELECT SUBMISSION</div>
            {SUBMISSIONS.map(sub => (
              <div key={sub.id} className="card card-sm" onClick={() => setSelected(sub)} style={{
                cursor:'pointer', marginBottom: 8,
                borderColor: selected.id===sub.id ? 'var(--accent-primary)' : undefined,
                background: selected.id===sub.id ? 'rgba(99,102,241,0.08)' : undefined,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.student}</div>
                    <div style={{ fontSize: 12, color:'var(--text-muted)' }}>{sub.assignment}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color:'var(--accent-primary)' }}>{sub.teacher ?? sub.ai}</div>
                    {sub.teacher && <span className="badge badge-warning" style={{ fontSize: 10 }}>Calibrated</span>}
                    {!sub.teacher && <span className="badge badge-info" style={{ fontSize: 10 }}>AI Score</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calibration Panel */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{selected.student}</h3>
                <p style={{ fontSize: 13, color:'var(--text-muted)' }}>{selected.assignment}</p>
              </div>
              <div style={{ display:'flex', gap: 24, alignItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <ScoreBadge score={selected.ai} size={60} />
                  <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 4 }}>AI Score</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <ScoreBadge score={selected.teacher ?? selected.ai} size={60} />
                  <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 4 }}>Final Score</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop:'1px solid var(--border)', paddingTop: 20, display:'flex', flexDirection:'column', gap: 18 }}>
              {TRAITS.map(trait => {
                const aiScore = aiTraitScores[trait]
                const override = overrides[trait]
                const current = override ?? aiScore
                const diff = override ? override - aiScore : 0
                return (
                  <div key={trait}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8, alignItems:'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: traitColors[trait] }}>{trait}</span>
                      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color:'var(--text-muted)' }}>AI: <strong>{aiScore}</strong></span>
                        {override && (
                          <span style={{ fontSize: 12, color: diff > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                        <span style={{ fontWeight: 800, fontSize: 16, color: traitColors[trait] }}>{current}</span>
                      </div>
                    </div>
                    <input
                      type="range" min={0} max={100} step={1}
                      value={current}
                      onChange={e => handleOverride(trait, e.target.value)}
                      style={{ width:'100%', accentColor: traitColors[trait], cursor:'pointer' }}
                    />
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 24, display:'flex', gap:12 }}>
              <button className="btn btn-secondary" onClick={() => setOverrides({})}>Reset to AI Scores</button>
              <button id="save-calibration-btn" className="btn btn-primary" onClick={handleSave}>💾 Save Calibration</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
