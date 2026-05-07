import { useState } from 'react'
import Header from '../components/Header'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api'

const SAMPLE_ESSAY = `Social media has become an integral part of teenage life, but its effects on mental health are deeply concerning. Platforms like Instagram and TikTok create unrealistic standards of beauty and success that teenagers feel compelled to meet. This constant comparison leads to anxiety, depression, and lowered self-esteem among adolescents.\n\nResearch from the American Psychological Association confirms that heavy social media use correlates with increased rates of depression in teenagers aged 13-17. A study of 6,500 students found that those who spent more than three hours daily on social media were 35% more likely to report poor mental health outcomes. These statistics paint a troubling picture of our digital generation.\n\nSome argue that social media provides valuable connection and community for isolated teenagers. While this point has merit, the benefits do not outweigh the systematic harm caused by algorithmic content.\n\nTherefore, schools and parents must implement digital literacy programs and screen time guidelines to protect teenage mental health.`

const DEMO_ANALYSIS = {
  basic_stats: { word_count:178, sentence_count:9, paragraph_count:4, avg_sentence_length:19.8, type_token_ratio:0.68 },
  readability:  { flesch_reading_ease:42.1, flesch_kincaid_grade:12.4, gunning_fog_index:14.8, smog_index:13.6, reading_level:'College' },
  passive_voice: { passive_sentence_count:1, total_sentences:9, passive_percentage:11.1, assessment:'Low' },
  sentence_lengths: { min_length:8, max_length:32, avg_length:19.8, std_dev:7.4, distribution:{ 'short(1-8)':1, 'medium(9-18)':4, 'long(19-30)':3, 'very_long(30+)':1 } },
  vocabulary:    { type_token_ratio:0.68, avg_word_length:5.2, transition_words_found:7, vocabulary_level:'Advanced' },
  argumentation: { has_thesis:true, has_evidence:true, has_counterargument:true, has_conclusion:true, argument_completeness:100, strength:'Strong' },
}

const TT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13 }}>{payload.map((p,i) => <div key={i} style={{ color:'var(--accent-secondary)' }}>{p.name}: <strong>{p.value}</strong></div>)}</div>
}

function GaugeMeter({ label, value, max=100, color='#6366f1', unit='' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:800, color }}>{value}{unit}</div>
      <div className="progress-bar-track" style={{ marginTop:6, marginBottom:4 }}>
        <div className="progress-bar-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
      <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
    </div>
  )
}

export default function StyleAnalyzer() {
  const [text, setText] = useState(SAMPLE_ESSAY)
  const [analysis, setAnalysis] = useState(DEMO_ANALYSIS)
  const [loading, setLoading] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    const res = await api.post('/scoring/score-text', { text })
    if (res?.raw_analysis) setAnalysis(res.raw_analysis)
    else setAnalysis(DEMO_ANALYSIS) // fallback
    setLoading(false)
  }

  const sentDistData = Object.entries(analysis.sentence_lengths?.distribution || {}).map(([k,v]) => ({ range:k, count:v }))

  return (
    <>
      <Header title="Writing Style Analyzer" subtitle="Deep-dive into readability, voice, and sentence variety" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">🎨 Writing Style Analyzer</h1>
        <p className="page-sub">Analyze readability scores, passive voice usage, sentence length variety, and vocabulary sophistication.</p>

        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ fontWeight:600, fontSize:15 }}>📝 Essay Text</h3>
            <button id="run-style-analysis-btn" className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
              {loading ? '⏳ Analyzing…' : '🎨 Analyze Style'}
            </button>
          </div>
          <textarea className="textarea" style={{ minHeight:160 }} value={text} onChange={e => setText(e.target.value)} placeholder="Paste essay text here..." />
        </div>

        {/* Basic Stats */}
        <div className="grid-4" style={{ marginBottom:24 }}>
          {[
            ['Words', analysis.basic_stats?.word_count, '#6366f1'],
            ['Sentences', analysis.basic_stats?.sentence_count, '#22d3ee'],
            ['Paragraphs', analysis.basic_stats?.paragraph_count, '#10b981'],
            ['Avg Sent. Length', analysis.basic_stats?.avg_sentence_length, '#f59e0b'],
          ].map(([label, val, color]) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color }}>{val ?? '—'}</div>
            </div>
          ))}
        </div>

        {/* Readability + Passive Voice */}
        <div className="grid-2" style={{ marginBottom:24 }}>
          <div className="card">
            <h3 style={{ marginBottom:20, fontWeight:600, fontSize:15 }}>📖 Readability Scores</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <GaugeMeter label="Flesch Reading Ease"    value={analysis.readability?.flesch_reading_ease}  max={100} color="#6366f1" />
              <GaugeMeter label="Flesch-Kincaid Grade"   value={analysis.readability?.flesch_kincaid_grade} max={18}  color="#22d3ee" />
              <GaugeMeter label="Gunning Fog Index"      value={analysis.readability?.gunning_fog_index}    max={20}  color="#f59e0b" />
              <GaugeMeter label="SMOG Index"             value={analysis.readability?.smog_index}           max={18}  color="#a855f7" />
            </div>
            <div style={{ marginTop:16, padding:'10px 16px', background:'rgba(99,102,241,0.1)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:700, color:'var(--accent-primary)' }}>Reading Level:</span>
              <span style={{ color:'var(--text-secondary)' }}>{analysis.readability?.reading_level}</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom:20, fontWeight:600, fontSize:15 }}>🗣️ Voice & Style Metrics</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>Passive Voice</span>
                  <span style={{ fontWeight:700, color: analysis.passive_voice?.passive_percentage > 30 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                    {analysis.passive_voice?.passive_percentage?.toFixed(1)}% — {analysis.passive_voice?.assessment}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width:`${analysis.passive_voice?.passive_percentage || 0}%`, background: analysis.passive_voice?.passive_percentage > 30 ? 'var(--accent-danger)' : 'var(--accent-success)' }} />
                </div>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>Lexical Diversity (TTR)</span>
                  <span style={{ fontWeight:700, color:'var(--accent-secondary)' }}>{((analysis.vocabulary?.type_token_ratio || 0)*100).toFixed(0)}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width:`${(analysis.vocabulary?.type_token_ratio || 0)*100}%`, background:'var(--accent-secondary)' }} />
                </div>
              </div>
              {[
                ['Vocabulary Level',    analysis.vocabulary?.vocabulary_level,    'badge-info'],
                ['Transition Words',    `${analysis.vocabulary?.transition_words_found} found`, 'badge-success'],
                ['Avg Word Length',     `${analysis.vocabulary?.avg_word_length} chars`, 'badge-neutral'],
                ['Argument Strength',  analysis.argumentation?.strength,           analysis.argumentation?.strength==='Strong' ? 'badge-success' : 'badge-warning'],
              ].map(([label, val, badge]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
                  <span className={`badge ${badge}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentence Length Distribution */}
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ marginBottom:16, fontWeight:600, fontSize:15 }}>📏 Sentence Length Distribution</h3>
          <div style={{ display:'flex', gap:24, alignItems:'center', marginBottom:16 }}>
            {[['Min',analysis.sentence_lengths?.min_length],['Avg',analysis.sentence_lengths?.avg_length],['Max',analysis.sentence_lengths?.max_length],['Std Dev',analysis.sentence_lengths?.std_dev]].map(([l,v]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--accent-primary)' }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l} words</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sentDistData}>
              <XAxis dataKey="range" tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis tick={{ fill:'#64748b', fontSize:12 }} />
              <Tooltip content={<TT />} />
              <Bar dataKey="count" fill="#22d3ee" radius={[6,6,0,0]} name="Sentences" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Argumentation Checklist */}
        <div className="card">
          <h3 style={{ marginBottom:16, fontWeight:600, fontSize:15 }}>🧩 Argument Structure Checklist</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {[
              ['Thesis Statement',   analysis.argumentation?.has_thesis],
              ['Evidence Present',   analysis.argumentation?.has_evidence],
              ['Counterargument',    analysis.argumentation?.has_counterargument],
              ['Conclusion',         analysis.argumentation?.has_conclusion],
            ].map(([label, ok]) => (
              <div key={label} style={{ textAlign:'center', padding:16, background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius:'var(--radius-md)', border:`1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{ok ? '✅' : '❌'}</div>
                <div style={{ fontSize:12, fontWeight:600, color: ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
