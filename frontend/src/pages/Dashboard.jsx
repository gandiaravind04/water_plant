import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplet, AlertTriangle, DollarSign, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const { t } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeCans: 0, overdueCans: 0, amountDue: 0, activeCount: 0 });

  const authCfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const r = await axios.get('http://localhost:5000/api/cans', authCfg());
      setTransactions(r.data);
      calculateStats(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = txs => {
    let activeCans = 0, overdueCans = 0, amountDue = 0, activeCount = 0;
    txs.forEach(tx => {
      if (tx.status !== 'returned') {
        const rem = tx.cansIssued - tx.cansReturned;
        activeCans += rem;
        amountDue += tx.amountDue;
        activeCount++;
        if (tx.status === 'overdue' || new Date() > new Date(tx.dueAt)) overdueCans += rem;
      }
    });
    setStats({ activeCans, overdueCans, amountDue, activeCount });
  };

  useEffect(() => {
    fetchTransactions();
    const iv = setInterval(fetchTransactions, 60000);
    return () => clearInterval(iv);
  }, []);

  const getRemainingTimeText = dueAt => {
    const diff = new Date(dueAt).getTime() - Date.now();
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    return diff < 0 ? `Overdue by ${h}h ${m}m` : `Due in ${h}h ${m}m`;
  };

  const getWhatsAppLink = tx => {
    const rem = tx.cansIssued - tx.cansReturned;
    const isOverdue = new Date() > new Date(tx.dueAt);
    const msg = isOverdue
      ? `హలో *${tx.villagerName}* గారు, ఇది *మంజీరా వాటర్ ప్లాంట్* (Manjira Plant) నుండి రిమైండర్. మీరు తీసుకెళ్లిన *${rem} వాటర్ క్యాన్లు* తిరిగి ఇవ్వాల్సిన సమయం (24 గంటలు) పూర్తయింది. దయచేసి వాటిని ప్లాంట్ వద్ద సమర్పించవలసిందిగా కోరుతున్నాము. ధన్యవాదాలు!`
      : `హలో *${tx.villagerName}* గారు, ఇది *మంజీరా వాటర్ ప్లాంట్* (Manjira Plant) నుండి సమాచారం. మీరు తీసుకెళ్లిన *${rem} వాటర్ క్యాన్లు* తిరిగి ఇవ్వడానికి సమయం ముగుస్తోంది. దయచేసి గమనించగలరు. ధన్యవాదాలు!`;
    let phone = tx.phone.trim().replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
  };

  const active = transactions.filter(tx => tx.status !== 'returned');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="glow-text-cyan">{t.operationalDashboard}</h1>
        <button onClick={fetchTransactions} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} />{t.refresh}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t.activeOutCans}</span>
            <Droplet size={20} className="glow-text-cyan" fill="currentColor" />
          </div>
          <h2 style={{ fontSize: '32px' }}>{stats.activeCans}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t.cansWithVillagers}</p>
        </div>

        <div className="glass-panel metric-card overdue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t.overdueReturnCans}</span>
            <AlertTriangle size={20} style={{ color: 'var(--status-overdue)' }} />
          </div>
          <h2 style={{ fontSize: '32px', color: 'var(--status-overdue)' }}>{stats.overdueCans}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t.outstandingPast24}</p>
        </div>

        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t.outstandingBalance}</span>
            <DollarSign size={20} style={{ color: 'var(--status-pending)' }} />
          </div>
          <h2 style={{ fontSize: '32px', color: 'var(--status-pending)' }}>₹{stats.amountDue}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t.totalPendingDue}</p>
        </div>

        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t.activeLedgers}</span>
            <Clock size={20} style={{ color: 'var(--primary-cyan)' }} />
          </div>
          <h2 style={{ fontSize: '32px' }}>{stats.activeCount}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t.currentActiveHandouts}</p>
        </div>
      </div>

      {/* Return Reminders */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} className="glow-text-cyan" />
          {t.activeReturnReminders}
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.loadingTimers}</div>
        ) : active.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '16px' }}>{t.allReturned}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {active.map(tx => {
              const rem = tx.cansIssued - tx.cansReturned;
              const isOverdue = new Date() > new Date(tx.dueAt);
              return (
                <div key={tx._id} className={`glass-panel ${isOverdue ? 'overdue-pulse' : ''}`}
                  style={{ padding: '20px', borderRadius: '14px', borderLeft: `4px solid ${isOverdue ? 'var(--status-overdue)' : 'var(--status-pending)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '600' }}>{tx.villagerName}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <strong className="glow-text-cyan">{tx.village?.name || '—'}</strong>
                      </p>
                    </div>
                    <span className={`badge ${isOverdue ? 'badge-overdue' : 'badge-pending'}`}>{tx.status}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', padding: '10px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t.cansDue}: </span>
                      <strong style={{ fontSize: '16px' }}>{rem}</strong>/{tx.cansIssued}
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t.duePay}: </span>
                      <strong style={{ color: 'var(--status-pending)' }}>₹{tx.amountDue}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: isOverdue ? 'var(--status-overdue)' : 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      <span style={{ fontWeight: '500' }}>{getRemainingTimeText(tx.dueAt)}</span>
                    </div>
                    <a href={getWhatsAppLink(tx)} target="_blank" rel="noopener noreferrer" className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 10px rgba(37,211,102,0.2)', textDecoration: 'none', color: 'white' }}>
                      <MessageSquare size={14} />{t.sendReminder}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
