import { useState } from 'react'
import Header from '../components/Header'
import { api } from '../api'

const DEFAULT_TRAITS = [
  { name:'Grammar',          max_score:20, weight:1.0, descriptors:[
    { score:4, label:'Exemplary',  description:'No grammatical or spelling errors' },
    { score:3, label:'Proficient', description:'Minimal errors that don\'t impede understanding' },
    { score:2, label:'Developing', description:'Some errors that occasionally impede reading' },
    { score:1, label:'Beginning',  description:'Frequent errors that seriously impede understanding' },
  ]},
  { name:'Argument Strength', max_score:30, weight:1.5, descriptors:[
    { score:4, label:'Exemplary',  description:'Clear, compelling thesis with strong evidence and counterargument' },
    { score:3, label:'Proficient', description:'Clear thesis with adequate evidence' },
    { score:2, label:'Developing', description:'Thesis present but evidence is weak' },
    { score:1, label:'Beginning',  description:'No clear thesis or evidence' },
  ]},
  { name:'Coherence', max_score:25, weight:1.2, descriptors:[
    { score:4, label:'Exemplary',  description:'Exceptionally well-organized with smooth transitions' },
    { score:3, label:'Proficient', description:'Generally organized with adequate transitions' },
    { score:2, label:'Developing', description:'Some organizational issues' },
    { score:1, label:'Beginning',  description:'Lacks clear organization' },
  ]},
]

export default function RubricBuilder() {
  const [rubricName, setRubricName] = useState('Argumentative Essay Rubric')
  const [traits, setTraits] = useState(DEFAULT_TRAITS)
  const [saved, setSaved] = useState(false)
  const [expandedTrait, setExpandedTrait] = useState(null)

  function addTrait() {
    setTraits(prev => [...prev, {
      name:'New Trait', max_score:20, weight:1.0,
      descriptors:[
        { score:4, label:'Exemplary',  description:'Description for exemplary performance' },
        { score:3, label:'Proficient', description:'Description for proficient performance' },
        { score:2, label:'Developing', description:'Description for developing performance' },
        { score:1, label:'Beginning',  description:'Description for beginning performance' },
      ]
    }])
  }

  function removeTrait(idx) { setTraits(prev => prev.filter((_,i) => i !== idx)) }

  function updateTrait(idx, field, val) {
    setTraits(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t))
  }

  function updateDescriptor(tIdx, dIdx, field, val) {
    setTraits(prev => prev.map((t, i) => {
      if (i !== tIdx) return t
      const descs = t.descriptors.map((d, j) => j === dIdx ? { ...d, [field]: val } : d)
      return { ...t, descriptors: descs }
    }))
  }

  async function handleSave() {
    const body = { assignment_id:'a-001', name: rubricName, traits, grade_scale:'percentage' }
    await api.post('/rubrics/create', body)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalWeight = traits.reduce((s, t) => s + Number(t.weight), 0)
  const COLORS = ['#6366f1','#10b981','#22d3ee','#f59e0b','#a855f7','#ef4444']

  return (
    <>
      <Header title="Rubric Builder" subtitle="Design and publish custom scoring rubrics" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">📋 Rubric Builder</h1>
        <p className="page-sub">Build custom multi-trait rubrics with descriptors for each performance level.</p>

        {saved && <div className="alert alert-success">✅ Rubric saved and published!</div>}

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Rubric Name</label>
              <input id="rubric-name" className="input" value={rubricName} onChange={e => setRubricName(e.target.value)} />
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
              <div style={{ flex:1 }}>
                <label className="form-label">Total Weight</label>
                <div style={{ fontSize: 24, fontWeight: 800, color:'var(--accent-primary)', paddingTop: 8 }}>{totalWeight.toFixed(1)}</div>
              </div>
              <div style={{ flex:1 }}>
                <label className="form-label">Traits</label>
                <div style={{ fontSize: 24, fontWeight: 800, color:'var(--accent-secondary)', paddingTop: 8 }}>{traits.length}</div>
              </div>
            </div>
          </div>
        </div>

        {traits.map((trait, tIdx) => (
          <div key={tIdx} className="card" style={{ marginBottom: 16, borderLeft:`3px solid ${COLORS[tIdx % COLORS.length]}` }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom: expandedTrait===tIdx ? 20 : 0 }}>
              <input className="input" style={{ flex:2 }} value={trait.name} onChange={e => updateTrait(tIdx,'name',e.target.value)} placeholder="Trait name" />
              <input className="input" style={{ width:80 }} type="number" min={5} max={50} value={trait.max_score} onChange={e => updateTrait(tIdx,'max_score',Number(e.target.value))} placeholder="Max" />
              <input className="input" style={{ width:80 }} type="number" min={0.1} max={3} step={0.1} value={trait.weight} onChange={e => updateTrait(tIdx,'weight',Number(e.target.value))} placeholder="Wt" />
              <button className="btn btn-secondary btn-sm" onClick={() => setExpandedTrait(expandedTrait===tIdx ? null : tIdx)}>
                {expandedTrait===tIdx ? '▲ Collapse' : '▼ Descriptors'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => removeTrait(tIdx)}>✕</button>
            </div>

            {expandedTrait === tIdx && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {trait.descriptors.map((desc, dIdx) => (
                  <div key={dIdx} style={{ background:'var(--bg-surface)', borderRadius:'var(--radius-md)', padding:12, border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:700, fontSize:12, color: COLORS[tIdx % COLORS.length], marginBottom:8 }}>
                      Score {desc.score} — {desc.label}
                    </div>
                    <textarea
                      className="textarea"
                      style={{ minHeight:80, fontSize:12 }}
                      value={desc.description}
                      onChange={e => updateDescriptor(tIdx, dIdx, 'description', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ display:'flex', gap:12, marginTop: 16 }}>
          <button id="add-trait-btn" className="btn btn-secondary" onClick={addTrait}>+ Add Trait</button>
          <button id="save-rubric-btn" className="btn btn-primary" onClick={handleSave}>💾 Save & Publish Rubric</button>
        </div>
      </div>
    </>
  )
}
