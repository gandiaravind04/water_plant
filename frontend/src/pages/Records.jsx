import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Plus, RotateCcw, PlusCircle, CheckCircle,
  ChevronDown, ChevronUp, X, Phone, Trash2, AlertTriangle,
  MessageSquare, Clock, Droplet, IndianRupee,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const API = 'http://localhost:5000/api';

/* ─── WhatsApp link helper ───────────────────────────────────────────────── */
const makeWhatsAppLink = (tx) => {
  const rem  = tx.cansIssued - tx.cansReturned;
  const late = new Date() > new Date(tx.dueAt);
  const msg  = late
    ? `హలో *${tx.villagerName}* గారు, ఇది *మంజీరా వాటర్ ప్లాంట్* నుండి రిమైండర్. మీరు తీసుకెళ్లిన *${rem} వాటర్ క్యాన్లు* తిరిగి ఇవ్వాల్సిన సమయం పూర్తయింది. దయచేసి వాటిని ప్లాంట్ వద్ద సమర్పించవలసిందిగా కోరుతున్నాము. ధన్యవాదాలు!`
    : `హలో *${tx.villagerName}* గారు, ఇది *మంజీరా వాటర్ ప్లాంట్* నుండి సమాచారం. మీరు తీసుకెళ్లిన *${rem} వాటర్ క్యాన్లు* తిరిగి ఇవ్వడానికి సమయం ముగుస్తోంది. దయచేసి గమనించగలరు. ధన్యవాదాలు!`;
  let ph = tx.phone.trim().replace(/\D/g,'');
  if (ph.length === 10) ph = '91' + ph;
  return `https://api.whatsapp.com/send?phone=${ph}&text=${encodeURIComponent(msg)}`;
};

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const statusColor = s => ({
  returned: 'var(--status-returned)',
  overdue:  'var(--status-overdue)',
  partially_returned: 'var(--status-partial)',
}[s] ?? 'var(--status-pending)');

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const Records = () => {
  const { t } = useApp();
  const [transactions, setTransactions]   = useState([]);
  const [villages, setVillages]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [searchParams, setSearchParams]   = useSearchParams();
  const [canPrice, setCanPrice]           = useState(20);

  /* preview bottom-sheet */
  const [previewTx, setPreviewTx]         = useState(null);

  /* action modals */
  const [activeModal, setActiveModal]     = useState(null);
  const [selectedTx, setSelectedTx]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  /* desktop expand */
  const [expandedRow, setExpandedRow]     = useState(null);

  /* form state */
  const [newTx, setNewTx]                 = useState({
    villagerName:'', phone:'', villageId:'', cansIssued:1, amountPaid:20, amountDue:0,
  });
  const [returnCount, setReturnCount]     = useState(1);
  const [actionDetails, setActionDetails] = useState({ cansCount:1, payment:20, due:0 });
  const [formError, setFormError]         = useState('');

  const authCfg = () => ({ headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } });

  /* ── data fetching ────────────────────────────────────────────────────── */
  const fetchCanPrice = async () => {
    try {
      const r = await axios.get(`${API}/auth/profile`, authCfg());
      const p = r.data.canPrice || 20;
      setCanPrice(p); localStorage.setItem('canPrice', p);
      setNewTx(prev => ({ ...prev, amountPaid: prev.cansIssued * p }));
    } catch {
      const c = localStorage.getItem('canPrice');
      if (c) setCanPrice(Number(c));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txR, vR] = await Promise.all([
        axios.get(`${API}/cans`,    authCfg()),
        axios.get(`${API}/villages`,authCfg()),
      ]);
      setTransactions(txR.data);
      setVillages(vR.data);
      if (vR.data.length && !newTx.villageId)
        setNewTx(p => ({ ...p, villageId: vR.data[0]._id }));
      await fetchCanPrice();
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchData(); },[]);

  useEffect(()=>{
    if (searchParams.get('action') === 'issue'){
      openModal('issue'); setSearchParams({});
    }
  },[searchParams]);

  /* ── auto-math helpers ───────────────────────────────────────────────── */
  const handleCansIssuedChange = v => {
    const n = Number(v);
    setNewTx(p=>({...p, cansIssued:n, amountPaid:n*canPrice, amountDue:0}));
  };
  const handleAmountPaidChange = v => {
    const val = Number(v), total = newTx.cansIssued*canPrice;
    setNewTx(p=>({...p, amountPaid:val, amountDue:Math.max(0,total-val)}));
  };
  const handleAmountDueChange  = v => {
    const val = Number(v), total = newTx.cansIssued*canPrice;
    setNewTx(p=>({...p, amountDue:val, amountPaid:Math.max(0,total-val)}));
  };
  const setQuick = type => {
    const total = newTx.cansIssued*canPrice;
    setNewTx(p => type==='paid' ? {...p,amountPaid:total,amountDue:0} : {...p,amountPaid:0,amountDue:total});
  };

  const handleActionCansChange = v => {
    const n=Number(v);
    setActionDetails({cansCount:n, payment:n*canPrice, due:0});
  };
  const handleActionPayChange = v => {
    const val=Number(v), total=actionDetails.cansCount*canPrice;
    setActionDetails(p=>({...p,payment:val,due:Math.max(0,total-val)}));
  };
  const handleActionDueChange = v => {
    const val=Number(v), total=actionDetails.cansCount*canPrice;
    setActionDetails(p=>({...p,due:val,payment:Math.max(0,total-val)}));
  };
  const setActionQuick = type => {
    const total=actionDetails.cansCount*canPrice;
    setActionDetails(p=> type==='paid' ? {...p,payment:total,due:0} : {...p,payment:0,due:total});
  };

  /* ── modal helpers ───────────────────────────────────────────────────── */
  const openModal = (type, tx=null) => {
    setFormError(''); setSelectedTx(tx); setActiveModal(type);
    if (type==='return' && tx) setReturnCount(tx.cansIssued - tx.cansReturned);
    if ((type==='refill'||type==='extra') && tx){
      const cnt = type==='extra' ? 1 : tx.cansIssued;
      setActionDetails({cansCount:cnt, payment:cnt*canPrice, due:0});
    }
  };
  const closeModal = () => {
    setActiveModal(null); setSelectedTx(null); setFormError('');
    setNewTx({villagerName:'',phone:'',villageId:villages[0]?._id||'',cansIssued:1,amountPaid:canPrice,amountDue:0});
  };

  /* ── submissions ─────────────────────────────────────────────────────── */
  const handleIssueCans = async e => {
    e.preventDefault(); setFormError('');
    try { await axios.post(`${API}/cans`, newTx, authCfg()); closeModal(); fetchData(); }
    catch(err){ setFormError(err.response?.data?.message || 'Failed'); }
  };
  const handleReturnSubmit = async e => {
    e.preventDefault();
    try { await axios.post(`${API}/cans/${selectedTx._id}/return`,{cansReturnedCount:returnCount},authCfg()); closeModal(); fetchData(); }
    catch(err){ setFormError(err.response?.data?.message||'Failed'); }
  };
  const handleRefillSubmit = async e => {
    e.preventDefault();
    try { await axios.post(`${API}/cans/${selectedTx._id}/refill`,{cansRefilled:actionDetails.cansCount,additionalPayment:actionDetails.payment,additionalDue:actionDetails.due},authCfg()); closeModal(); fetchData(); }
    catch(err){ setFormError(err.response?.data?.message||'Failed'); }
  };
  const handleExtraSubmit = async e => {
    e.preventDefault();
    try { await axios.post(`${API}/cans/${selectedTx._id}/extra`,{extraCans:actionDetails.cansCount,additionalPayment:actionDetails.payment,additionalDue:actionDetails.due},authCfg()); closeModal(); fetchData(); }
    catch(err){ setFormError(err.response?.data?.message||'Failed'); }
  };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/cans/${deleteTarget._id}`, authCfg());
      setDeleteTarget(null);
      if (previewTx?._id === deleteTarget._id) setPreviewTx(null);
      fetchData();
    } catch(e){ console.error(e); }
  };

  /* ── filter ──────────────────────────────────────────────────────────── */
  const filteredTxs = transactions.filter(tx => {
    const q = search.toLowerCase();
    return (
      (tx.villagerName.toLowerCase().includes(q) ||
       tx.phone.includes(q) ||
       tx.village?.name?.toLowerCase().includes(q)) &&
      (filterStatus==='all' || tx.status===filterStatus)
    );
  });

  const statusLabel = s => ({ returned:t.returned, overdue:t.overdue, partially_returned:t.partial }[s] ?? t.pending);

  /* ── shared small components ─────────────────────────────────────────── */
  const FormError = () => formError ? (
    <div style={{background:'rgba(239,68,68,0.1)',color:'var(--status-overdue)',border:'1px solid rgba(239,68,68,0.2)',padding:'12px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>
      {formError}
    </div>
  ) : null;

  const CostBadge = ({count,price}) => (
    <div className="cost-badge">
      <span>{count} × ₹{price} =</span>
      <strong className="glow-text-cyan">₹{count*price}</strong>
    </div>
  );

  const QuickBtns = ({onPaid,onDue}) => (
    <div style={{display:'flex',gap:'10px'}}>
      <button type="button" onClick={onPaid} className="btn-secondary"
        style={{flex:1,padding:'10px',fontSize:'13px',borderColor:'var(--status-returned)',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
        <CheckCircle size={14} style={{color:'var(--status-returned)'}}/> {t.fullPaid}
      </button>
      <button type="button" onClick={onDue} className="btn-secondary"
        style={{flex:1,padding:'10px',fontSize:'13px',borderColor:'var(--status-overdue)',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
        <AlertTriangle size={14} style={{color:'var(--status-overdue)'}}/> {t.fullDue}
      </button>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <h1 className="glow-text-cyan">{t.recordsLedger}</h1>
      </div>

      {/* Filters */}
      <div className="glass-panel filters-bar" style={{padding:'14px 20px'}}>
        <div style={{position:'relative',flex:1}}>
          <Search size={16} style={{position:'absolute',left:'14px',top:'13px',color:'var(--text-muted)'}}/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t.searchPlaceholder} className="glass-input" style={{paddingLeft:'42px'}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'13px',color:'var(--text-secondary)',whiteSpace:'nowrap'}}>{t.statusLabel}</span>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            className="glass-input" style={{padding:'10px 14px'}}>
            <option value="all">{t.allLogs}</option>
            <option value="pending">{t.pending}</option>
            <option value="partially_returned">{t.partiallyReturned}</option>
            <option value="returned">{t.returned}</option>
            <option value="overdue">{t.overdue}</option>
          </select>
        </div>
      </div>

      {/* Records Area */}
      <div className="glass-panel" style={{padding:'20px'}}>
        {loading ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--text-secondary)'}}>{t.loadingLedger}</div>
        ) : filteredTxs.length === 0 ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)',fontSize:'16px'}}>{t.noRecords}</div>
        ) : (
          <>
            {/* ══ DESKTOP TABLE ══ */}
            <div className="table-container desktop-only">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{width:'36px'}}/>
                    <th>{t.villagerName}</th>
                    <th>{t.selectVillage}</th>
                    <th>{t.phoneNumber}</th>
                    <th>{t.cansStatus}</th>
                    <th>{t.financials}</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map(tx => {
                    const expanded = expandedRow === tx._id;
                    const color    = statusColor(tx.status);
                    return (
                      <React.Fragment key={tx._id}>
                        <tr style={{borderLeft:`3px solid ${color}`}}>
                          <td>
                            <button onClick={()=>setExpandedRow(expanded?null:tx._id)}
                              style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',display:'flex'}}>
                              {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </button>
                          </td>
                          <td style={{fontWeight:'600'}}>{tx.villagerName}</td>
                          <td><span className="village-chip">{tx.village?.name||'—'}</span></td>
                          <td>
                            <a href={`tel:${tx.phone}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-secondary)',textDecoration:'none'}}>
                              <Phone size={12}/>{tx.phone}
                            </a>
                          </td>
                          <td>
                            <div className="can-progress-wrap">
                              <span style={{fontSize:'13px'}}><strong>{tx.cansReturned}</strong>/{tx.cansIssued}</span>
                              <div className="can-progress-bar">
                                <div className="can-progress-fill" style={{width:`${Math.round(tx.cansReturned/tx.cansIssued*100)}%`,background:color}}/>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{color:'var(--status-returned)',fontWeight:'500',fontSize:'13px'}}>₹{tx.amountPaid}</span>
                            {tx.amountDue>0 && <span style={{display:'block',fontSize:'12px',color:'var(--status-overdue)'}}>Due ₹{tx.amountDue}</span>}
                          </td>
                          <td>
                            <span className={`badge badge-${tx.status==='partially_returned'?'partial':tx.status}`}>
                              {statusLabel(tx.status)}
                            </span>
                          </td>
                          <td>
                            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                              {tx.status!=='returned' && (<>
                                <button onClick={()=>openModal('return',tx)} className="action-pill" style={{'--pill-color':'var(--status-returned)'}}>
                                  <CheckCircle size={13}/>{t.returnBtn}
                                </button>
                                <button onClick={()=>openModal('refill',tx)} className="action-pill" style={{'--pill-color':'var(--primary-cyan)'}}>
                                  <RotateCcw size={13}/>{t.refillBtn}
                                </button>
                                <button onClick={()=>openModal('extra',tx)} className="action-pill" style={{'--pill-color':'var(--status-pending)'}}>
                                  <PlusCircle size={13}/>{t.extraBtn}
                                </button>
                              </>)}
                              <button onClick={()=>setDeleteTarget(tx)} className="action-pill" style={{'--pill-color':'var(--status-overdue)'}}>
                                <Trash2 size={13}/>{t.deleteBtn}
                              </button>
                              {/* WhatsApp on desktop too */}
                              <a href={makeWhatsAppLink(tx)} target="_blank" rel="noopener noreferrer"
                                className="action-pill" style={{'--pill-color':'#25D366',textDecoration:'none'}}>
                                <MessageSquare size={13}/>WA
                              </a>
                            </div>
                          </td>
                        </tr>

                        {expanded && (
                          <tr>
                            <td colSpan="8" style={{background:'var(--expanded-bg)',padding:'20px 40px'}}>
                              <AuditLog tx={tx} t={t}/>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ══ MOBILE MINIMAL CARDS ══ */}
            <div className="mobile-only mobile-card-list">
              {filteredTxs.map(tx => {
                const color = statusColor(tx.status);
                const isOverdue = tx.status === 'overdue';

                return (
                  <button
                    key={tx._id}
                    className={`record-card-minimal ${isOverdue ? 'overdue-pulse' : ''}`}
                    style={{'--card-accent': color}}
                    onClick={() => setPreviewTx(tx)}
                  >
                    {/* Left accent stripe */}
                    <div className="card-stripe" style={{background: color}}/>

                    {/* Avatar */}
                    <div className="card-min-avatar" style={{background:`${color}22`,color}}>
                      {tx.villagerName.charAt(0).toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="card-min-info">
                      <div className="card-min-name">{tx.villagerName}</div>
                      <div className="card-min-sub">
                        <span className="village-chip" style={{fontSize:'10px',padding:'2px 7px'}}>{tx.village?.name||'—'}</span>
                        <span className="card-min-phone"><Phone size={10}/>{tx.phone}</span>
                      </div>
                    </div>

                    {/* Finance summary */}
                    <div className="card-min-finance">
                      <div className="card-min-paid">₹{tx.amountPaid}</div>
                      {tx.amountDue > 0
                        ? <div className="card-min-due">-₹{tx.amountDue}</div>
                        : <div className="card-min-clear">✓</div>
                      }
                    </div>

                    {/* Status dot */}
                    <div className="card-min-dot" style={{background: color}}/>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM SHEET PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {previewTx && (
        <>
          {/* Scrim */}
          <div className="sheet-scrim" onClick={() => setPreviewTx(null)} />

          {/* Sheet */}
          <div className="bottom-sheet">
            {/* Handle */}
            <div className="sheet-handle" />

            {/* ── Hero Header ── */}
            <div className="sheet-hero">
              {/* coloured gradient layer */}
              <div className="sheet-hero-bg"
                style={{ background: `radial-gradient(ellipse at top left, ${statusColor(previewTx.status)} 0%, transparent 70%)` }} />

              <div className="sheet-hero-content">
                {/* Avatar */}
                <div className="sheet-avatar"
                  style={{ background: `${statusColor(previewTx.status)}28`, color: statusColor(previewTx.status) }}>
                  {previewTx.villagerName.charAt(0).toUpperCase()}
                </div>

                {/* Name + chips */}
                <div className="sheet-hero-text">
                  <div className="sheet-name">{previewTx.villagerName}</div>
                  <div className="sheet-hero-chips">
                    <span className="village-chip">{previewTx.village?.name || '—'}</span>
                    <span className={`badge badge-${previewTx.status === 'partially_returned' ? 'partial' : previewTx.status}`}>
                      {statusLabel(previewTx.status)}
                    </span>
                  </div>
                </div>

                {/* Close */}
                <button className="sheet-close" onClick={() => setPreviewTx(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── 3-Stat Row ── */}
            <div className="sheet-stats">
              {/* Cans */}
              <div className="sheet-stat">
                <div className="sheet-stat-icon"><Droplet size={11} /> Cans</div>
                <div className="sheet-stat-val" style={{ color: statusColor(previewTx.status) }}>
                  {previewTx.cansReturned}
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/{previewTx.cansIssued}</span>
                </div>
                <div className="sheet-can-bar">
                  <div className="sheet-can-fill"
                    style={{ width: `${Math.round(previewTx.cansReturned / previewTx.cansIssued * 100)}%`, background: statusColor(previewTx.status) }} />
                </div>
              </div>

              {/* Paid */}
              <div className="sheet-stat">
                <div className="sheet-stat-icon"><IndianRupee size={11} /> {t.paid}</div>
                <div className="sheet-stat-val" style={{ color: 'var(--status-returned)' }}>₹{previewTx.amountPaid}</div>
                <div className="sheet-stat-sub">received</div>
              </div>

              {/* Due / Clear */}
              <div className="sheet-stat">
                <div className="sheet-stat-icon"><Clock size={11} /> {previewTx.amountDue > 0 ? t.due : t.fullyPaid}</div>
                <div className="sheet-stat-val" style={{ color: previewTx.amountDue > 0 ? 'var(--status-overdue)' : 'var(--status-returned)' }}>
                  {previewTx.amountDue > 0 ? `₹${previewTx.amountDue}` : '✓'}
                </div>
                <div className="sheet-stat-sub">
                  {new Date(previewTx.dueAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            </div>

            <div className="sheet-divider" />

            {/* ── Contact Row ── */}
            <div className="sheet-contact-row">
              <a href={`tel:${previewTx.phone}`} className="sheet-contact-btn sheet-contact-btn--call">
                <Phone size={18} /><span>{previewTx.phone}</span>
              </a>
              <a href={makeWhatsAppLink(previewTx)} target="_blank" rel="noopener noreferrer"
                className="sheet-contact-btn sheet-contact-btn--wa">
                <MessageSquare size={18} /><span>WhatsApp</span>
              </a>
            </div>

            {/* ── Action Buttons ── */}
            {previewTx.status !== 'returned' && (
              <>
                <div className="sheet-action-label">Actions</div>
                <div className="sheet-actions">
                  <button className="sheet-btn sheet-btn--return"
                    onClick={() => { openModal('return', previewTx); setPreviewTx(null); }}>
                    <div className="sheet-btn-icon"><CheckCircle size={20} /></div>
                    {t.returnBtn}
                  </button>
                  <button className="sheet-btn sheet-btn--refill"
                    onClick={() => { openModal('refill', previewTx); setPreviewTx(null); }}>
                    <div className="sheet-btn-icon"><RotateCcw size={20} /></div>
                    {t.refillBtn}
                  </button>
                  <button className="sheet-btn sheet-btn--extra"
                    onClick={() => { openModal('extra', previewTx); setPreviewTx(null); }}>
                    <div className="sheet-btn-icon"><PlusCircle size={20} /></div>
                    {t.extraBtn}
                  </button>
                </div>
              </>
            )}

            {/* Delete — always full width */}
            <div style={{ padding: '0 16px', marginBottom: 20 }}>
              <button className="sheet-btn sheet-btn--delete"
                style={{ width: '100%', flexDirection: 'row', padding: '14px 20px', gap: 10, borderRadius: 14 }}
                onClick={() => { setDeleteTarget(previewTx); setPreviewTx(null); }}>
                <Trash2 size={18} />{t.deleteBtn}
              </button>
            </div>

            {/* ── Audit Log (if any) ── */}
            {previewTx.subTransactions?.length > 0 && (
              <div className="sheet-audit">
                <div className="sheet-audit-title">{t.auditLogs}</div>
                <AuditLog tx={previewTx} t={t} />
              </div>
            )}
          </div>
        </>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          MODALS (shared desktop + mobile)
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{maxWidth:'360px'}}>
            <div style={{textAlign:'center',padding:'10px 0 20px'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <Trash2 size={26} style={{color:'var(--status-overdue)'}}/>
              </div>
              <h3 style={{fontSize:'20px',marginBottom:'8px'}}>{t.deleteConfirmTitle}</h3>
              <p style={{color:'var(--text-secondary)',fontSize:'14px',marginBottom:'4px'}}>
                <strong>{deleteTarget.villagerName}</strong> — {deleteTarget.village?.name}
              </p>
              <p style={{color:'var(--status-overdue)',fontSize:'13px',marginTop:'8px'}}>{t.deleteWarning}</p>
            </div>
            <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
              <button onClick={()=>setDeleteTarget(null)} className="btn-secondary" style={{flex:1}}>{t.cancel}</button>
              <button onClick={handleDeleteConfirm} className="btn-primary"
                style={{flex:1,background:'linear-gradient(135deg,#ef4444,#b91c1c)',boxShadow:'0 4px 14px rgba(239,68,68,0.3)'}}>
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue New */}
      {activeModal === 'issue' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <ModalHeader title={t.logNewDistribution} onClose={closeModal}/>
            <FormError/>
            <form onSubmit={handleIssueCans} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <FormField label={t.villagerName}>
                <input type="text" value={newTx.villagerName}
                  onChange={e=>setNewTx(p=>({...p,villagerName:e.target.value}))}
                  className="glass-input" placeholder={t.enterName} required/>
              </FormField>
              <FormField label={t.phoneNumber}>
                <input type="tel" value={newTx.phone}
                  onChange={e=>setNewTx(p=>({...p,phone:e.target.value}))}
                  className="glass-input" placeholder={t.enterPhone} required/>
              </FormField>
              <FormField label={t.selectVillage}>
                <select value={newTx.villageId} onChange={e=>setNewTx(p=>({...p,villageId:e.target.value}))}
                  className="glass-input" required>
                  {villages.map(v=><option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </FormField>
              <CostBadge count={newTx.cansIssued||0} price={canPrice}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                <FormField label={t.cansIssued}>
                  <input type="number" min="1" value={newTx.cansIssued||''}
                    onChange={e=>handleCansIssuedChange(e.target.value)} className="glass-input" required/>
                </FormField>
                <FormField label={t.amountPaid}>
                  <input type="number" min="0" value={newTx.amountPaid===0?'0':(newTx.amountPaid||'')}
                    onChange={e=>handleAmountPaidChange(e.target.value)} className="glass-input"/>
                </FormField>
                <FormField label={t.amountDue}>
                  <input type="number" min="0" value={newTx.amountDue===0?'0':(newTx.amountDue||'')}
                    onChange={e=>handleAmountDueChange(e.target.value)} className="glass-input"/>
                </FormField>
              </div>
              <QuickBtns onPaid={()=>setQuick('paid')} onDue={()=>setQuick('due')}/>
              <button type="submit" className="btn-primary" style={{marginTop:'6px'}}>{t.confirmSave}</button>
            </form>
          </div>
        </div>
      )}

      {/* Return */}
      {activeModal === 'return' && selectedTx && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <ModalHeader title={`${t.returnModal}: ${selectedTx.villagerName}`} onClose={closeModal}/>
            <p style={{fontSize:'14px',color:'var(--text-secondary)',marginBottom:'16px'}}>
              {t.currentlyHas} <strong>{selectedTx.cansIssued - selectedTx.cansReturned}</strong> {t.cansOutstanding}
            </p>
            <FormError/>
            <form onSubmit={handleReturnSubmit} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <FormField label={t.numberOfCansReturned}>
                <input type="number" min="1" max={selectedTx.cansIssued - selectedTx.cansReturned}
                  value={returnCount} onChange={e=>setReturnCount(Number(e.target.value))}
                  className="glass-input" required/>
              </FormField>
              <button type="submit" className="btn-primary"
                style={{background:'linear-gradient(135deg,var(--status-returned),#059669)',boxShadow:'0 4px 14px rgba(16,185,129,0.3)'}}>
                {t.confirmReturn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Refill */}
      {activeModal === 'refill' && selectedTx && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <ModalHeader title={`${t.refillModal}: ${selectedTx.villagerName}`} onClose={closeModal}/>
            <p style={{fontSize:'14px',color:'var(--text-secondary)',marginBottom:'16px'}}>{t.refillDesc}</p>
            <FormError/>
            <form onSubmit={handleRefillSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <FormField label={t.cansRefilled}>
                <input type="number" min="1" value={actionDetails.cansCount||''}
                  onChange={e=>handleActionCansChange(e.target.value)} className="glass-input" required/>
              </FormField>
              <CostBadge count={actionDetails.cansCount||0} price={canPrice}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <FormField label={t.refillPay}>
                  <input type="number" min="0" value={actionDetails.payment===0?'0':(actionDetails.payment||'')}
                    onChange={e=>handleActionPayChange(e.target.value)} className="glass-input"/>
                </FormField>
                <FormField label={t.refillDue}>
                  <input type="number" min="0" value={actionDetails.due===0?'0':(actionDetails.due||'')}
                    onChange={e=>handleActionDueChange(e.target.value)} className="glass-input"/>
                </FormField>
              </div>
              <QuickBtns onPaid={()=>setActionQuick('paid')} onDue={()=>setActionQuick('due')}/>
              <button type="submit" className="btn-primary">{t.confirmRefill}</button>
            </form>
          </div>
        </div>
      )}

      {/* Extra */}
      {activeModal === 'extra' && selectedTx && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <ModalHeader title={`${t.extraModal}: ${selectedTx.villagerName}`} onClose={closeModal}/>
            <p style={{fontSize:'14px',color:'var(--text-secondary)',marginBottom:'16px'}}>{t.extraDesc}</p>
            <FormError/>
            <form onSubmit={handleExtraSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <FormField label={t.extraCansCheckedOut}>
                <input type="number" min="1" value={actionDetails.cansCount||''}
                  onChange={e=>handleActionCansChange(e.target.value)} className="glass-input" required/>
              </FormField>
              <CostBadge count={actionDetails.cansCount||0} price={canPrice}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <FormField label={t.extraPay}>
                  <input type="number" min="0" value={actionDetails.payment===0?'0':(actionDetails.payment||'')}
                    onChange={e=>handleActionPayChange(e.target.value)} className="glass-input"/>
                </FormField>
                <FormField label={t.extraDue}>
                  <input type="number" min="0" value={actionDetails.due===0?'0':(actionDetails.due||'')}
                    onChange={e=>handleActionDueChange(e.target.value)} className="glass-input"/>
                </FormField>
              </div>
              <QuickBtns onPaid={()=>setActionQuick('paid')} onDue={()=>setActionQuick('due')}/>
              <button type="submit" className="btn-primary"
                style={{background:'linear-gradient(135deg,var(--status-pending),#d97706)',boxShadow:'0 4px 14px rgba(251,191,36,0.2)'}}>
                {t.confirmExtras}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── small shared helpers ───────────────────────────────────────────────── */
const ModalHeader = ({title, onClose}) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
    <h3 style={{fontSize:'20px',lineHeight:1.2}}>{title}</h3>
    <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer'}}>
      <X size={20}/>
    </button>
  </div>
);

const FormField = ({label,children}) => (
  <div>
    <label style={{display:'block',fontSize:'13px',color:'var(--text-secondary)',marginBottom:'6px'}}>{label}</label>
    {children}
  </div>
);

const AuditLog = ({tx,t}) => (
  <div style={{borderLeft:'2px solid var(--primary-cyan)',paddingLeft:'14px'}}>
    <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'8px'}}>
      {t.checkout}: {new Date(tx.issuedAt).toLocaleString()} · {t.deadline}: {new Date(tx.dueAt).toLocaleString()}
    </div>
    {tx.subTransactions.length === 0 ? (
      <p style={{fontSize:'12px',color:'var(--text-muted)'}}>{t.noAuditLogs}</p>
    ) : (
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {tx.subTransactions.map((sub,i) => (
          <div key={sub._id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:'var(--audit-bg)',borderRadius:'8px',fontSize:'12px',flexWrap:'wrap',gap:'4px'}}>
            <strong style={{color:sub.actionType==='refill'?'var(--primary-cyan)':'var(--status-pending)'}}>
              {sub.actionType.toUpperCase()} — {sub.cansCount} cans
            </strong>
            <span style={{color:'var(--status-returned)'}}>₹{sub.additionalPayment} {t.paid}</span>
            <span style={{color:'var(--text-muted)'}}>{new Date(sub.timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default Records;
