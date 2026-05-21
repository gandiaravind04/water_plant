import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplet,
  IndianRupee,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const Dashboard = () => {
  const { t, lang } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [stats, setStats] = useState({
    activeCans: 0,
    overdueCans: 0,
    amountDue: 0,
    activeCount: 0,
    returnedCount: 0,
    dueSoonCount: 0,
  });

  const authCfg = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const calculateStats = (txs, currentNow = Date.now()) => {
    const list = Array.isArray(txs) ? txs : [];
    let activeCans = 0;
    let overdueCans = 0;
    let amountDue = 0;
    let activeCount = 0;
    let returnedCount = 0;
    let dueSoonCount = 0;

    list.forEach((tx) => {
      const remaining = tx.cansIssued - tx.cansReturned;
      const dueAtTime = new Date(tx.dueAt).getTime();
      const isReturned = tx.status === "returned";
      const isOverdue = !isReturned && dueAtTime <= currentNow;
      const isDueSoon =
        !isReturned &&
        !isOverdue &&
        dueAtTime - currentNow <= 3 * 60 * 60 * 1000;

      if (isReturned) {
        returnedCount += 1;
        return;
      }

      activeCans += remaining;
      amountDue += tx.amountDue;
      activeCount += 1;

      if (isOverdue) overdueCans += remaining;
      if (isDueSoon) dueSoonCount += 1;
    });

    setStats({
      activeCans,
      overdueCans,
      amountDue,
      activeCount,
      returnedCount,
      dueSoonCount,
    });
  };

  const fetchTransactions = async (withRefreshState = false) => {
    try {
      if (withRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cans/summary`,
        authCfg(),
      );
      const txs = Array.isArray(response.data)
        ? response.data
        : response.data?.transactions || [];
      const currentNow = Date.now();
      setTransactions(txs);
      setNow(currentNow);
      calculateStats(txs, currentNow);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const fetchInterval = setInterval(() => fetchTransactions(true), 60000);
    const clockInterval = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
    };
  }, []);

  useEffect(() => {
    calculateStats(transactions, now);
  }, [now]);

  const getWhatsAppLink = (tx) => {
    const remaining = tx.cansIssued - tx.cansReturned;
    const locationUrl = "https://maps.app.goo.gl/xfSYygfUVtkaB3kH7";
    const msg =
      lang === "te"
        ? `హలో ${tx.villagerName} గారు, ఇది మంజీరా వాటర్ ప్లాంట్ (Manjira Plant) నుండి సమాచారం. మీరు తీసుకెళ్లిన ${remaining} వాటర్ క్యాన్లు తిరిగి ఇవ్వాలని కోరుకుంటున్నాం. ప్లాంట్ లోకేషన్: ${locationUrl} దయచేసి గమనించగలరు. ధన్యవాదాలు!`
        : `Hello ${tx.villagerName}, this is Manjira Water Plant. We kindly request return of the ${remaining} water cans you took. Plant location: ${locationUrl} Thank you!`;
    let phone = tx.phone.trim().replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
  };

  const getRemainingTimeText = (dueAt) => {
    const diff = new Date(dueAt).getTime() - now;
    const abs = Math.abs(diff);
    const hours = Math.floor(abs / 3600000);
    const minutes = Math.floor((abs % 3600000) / 60000);
    return diff < 0
      ? `Overdue by ${hours}h ${minutes}m`
      : `Due in ${hours}h ${minutes}m`;
  };

  const activeTransactions = transactions.filter((tx) => tx.status !== "returned");
  const overdueTransactions = activeTransactions.filter(
    (tx) => new Date(tx.dueAt).getTime() <= now,
  );
  const dueSoonTransactions = activeTransactions.filter((tx) => {
    const dueAtTime = new Date(tx.dueAt).getTime();
    return dueAtTime > now && dueAtTime - now <= 3 * 60 * 60 * 1000;
  });
  const priorityTransactions = [...overdueTransactions, ...dueSoonTransactions]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 4);

  const villageBuckets = activeTransactions.reduce((acc, tx) => {
    const key = tx.village?.name || "Unknown";
    const remaining = tx.cansIssued - tx.cansReturned;
    if (!acc[key]) {
      acc[key] = { village: key, cans: 0, ledgers: 0, due: 0 };
    }
    acc[key].cans += remaining;
    acc[key].ledgers += 1;
    acc[key].due += tx.amountDue;
    return acc;
  }, {});

  const villageSummary = Object.values(villageBuckets)
    .sort((a, b) => b.cans - a.cans)
    .slice(0, 4);

  const completionRate = transactions.length
    ? Math.round((stats.returnedCount / transactions.length) * 100)
    : 0;

  return (
    <div className="page-container">
      <section className="glass-panel dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-hero-kicker">
            <Sparkles size={16} />
            <span>Plant operations</span>
          </div>
          <h1>{t.operationalDashboard}</h1>
          <p>
            A faster control room for returns, pending balance, and field
            follow-up across your serviced villages.
          </p>
          <div className="dashboard-hero-tags">
            <span className="dashboard-tag">
              <AlertTriangle size={14} />
              {stats.overdueCans} overdue cans
            </span>
            <span className="dashboard-tag">
              <Clock3 size={14} />
              {stats.dueSoonCount} due soon
            </span>
            <span className="dashboard-tag">
              <CheckCircle2 size={14} />
              {completionRate}% cycle completion
            </span>
          </div>
        </div>

        <div className="dashboard-hero-side">
          <button
            onClick={() => fetchTransactions(true)}
            className="btn-secondary dashboard-refresh-btn"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "inline-spinner" : ""}
            />
            <span>{refreshing ? "Refreshing..." : t.refresh}</span>
          </button>
          <div className="dashboard-status-orb">
            <div className="dashboard-status-ring" />
            <div className="dashboard-status-center">
              <span>Live</span>
              <strong>{stats.activeCount}</strong>
              <small>open ledgers</small>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <article className="glass-panel dashboard-kpi-card cyan">
          <div className="dashboard-kpi-head">
            <span>{t.activeOutCans}</span>
            <Droplet size={18} />
          </div>
          <strong>{stats.activeCans}</strong>
          <p>{t.cansWithVillagers}</p>
        </article>

        <article className="glass-panel dashboard-kpi-card amber">
          <div className="dashboard-kpi-head">
            <span>{t.outstandingBalance}</span>
            <IndianRupee size={18} />
          </div>
          <strong>₹{stats.amountDue}</strong>
          <p>{t.totalPendingDue}</p>
        </article>

        <article className="glass-panel dashboard-kpi-card red">
          <div className="dashboard-kpi-head">
            <span>{t.overdueReturnCans}</span>
            <AlertTriangle size={18} />
          </div>
          <strong>{stats.overdueCans}</strong>
          <p>{t.outstandingPast24}</p>
        </article>

        <article className="glass-panel dashboard-kpi-card green">
          <div className="dashboard-kpi-head">
            <span>Recovered cycles</span>
            <CheckCircle2 size={18} />
          </div>
          <strong>{stats.returnedCount}</strong>
          <p>{completionRate}% of all recorded transactions</p>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="glass-panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-panel-eyebrow">Attention board</span>
              <h3>Priority follow-up</h3>
            </div>
            <span className="dashboard-panel-count">
              {priorityTransactions.length} items
            </span>
          </div>

          {loading ? (
            <div className="dashboard-empty">{t.loadingTimers}</div>
          ) : priorityTransactions.length === 0 ? (
            <div className="dashboard-empty">
              No urgent reminders right now. The return queue is under control.
            </div>
          ) : (
            <div className="dashboard-priority-list">
              {priorityTransactions.map((tx) => {
                const remaining = tx.cansIssued - tx.cansReturned;
                const isOverdue = new Date(tx.dueAt).getTime() <= now;
                return (
                  <div
                    key={tx._id}
                    className={`dashboard-priority-item ${isOverdue ? "is-overdue" : ""}`}
                  >
                    <div className="dashboard-priority-top">
                      <div>
                        <h4>{tx.villagerName}</h4>
                        <p>
                          <MapPin size={13} />
                          <span>{tx.village?.name || "Unknown village"}</span>
                        </p>
                      </div>
                      <span
                        className={`badge ${isOverdue ? "badge-overdue" : "badge-pending"}`}
                      >
                        {isOverdue ? "Overdue" : "Due soon"}
                      </span>
                    </div>

                    <div className="dashboard-priority-meta">
                      <div>
                        <span>Outstanding</span>
                        <strong>{remaining} cans</strong>
                      </div>
                      <div>
                        <span>Balance</span>
                        <strong>₹{tx.amountDue}</strong>
                      </div>
                      <div>
                        <span>Timer</span>
                        <strong>{getRemainingTimeText(tx.dueAt)}</strong>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppLink(tx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-inline-link"
                    >
                      <MessageSquare size={14} />
                      <span>{t.sendReminder}</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="glass-panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <span className="dashboard-panel-eyebrow">Coverage view</span>
              <h3>Village activity snapshot</h3>
            </div>
            <span className="dashboard-panel-count">
              {villageSummary.length} villages
            </span>
          </div>

          <div className="dashboard-progress-card">
            <div className="dashboard-progress-copy">
              <span>Return performance</span>
              <strong>{completionRate}%</strong>
            </div>
            <div className="dashboard-progress-track">
              <div
                className="dashboard-progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {villageSummary.length === 0 ? (
            <div className="dashboard-empty">
              Add transactions to start seeing village-level activity.
            </div>
          ) : (
            <div className="dashboard-village-list">
              {villageSummary.map((item) => (
                <div key={item.village} className="dashboard-village-row">
                  <div className="dashboard-village-name">
                    <Activity size={15} />
                    <span>{item.village}</span>
                  </div>
                  <div className="dashboard-village-metrics">
                    <span>{item.ledgers} ledgers</span>
                    <strong>{item.cans} cans</strong>
                    <span>₹{item.due} due</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="glass-panel dashboard-reminders-panel">
        <div className="dashboard-panel-head">
          <div>
            <span className="dashboard-panel-eyebrow">Field queue</span>
            <h3>{t.activeReturnReminders}</h3>
          </div>
          <span className="dashboard-panel-count">
            {activeTransactions.length} active
          </span>
        </div>

        {loading ? (
          <div className="dashboard-empty">{t.loadingTimers}</div>
        ) : activeTransactions.length === 0 ? (
          <div className="dashboard-empty">{t.allReturned}</div>
        ) : (
          <div className="dashboard-reminder-grid">
            {activeTransactions.map((tx) => {
              const remaining = tx.cansIssued - tx.cansReturned;
              const isOverdue = new Date(tx.dueAt).getTime() <= now;
              return (
                <article
                  key={tx._id}
                  className={`dashboard-reminder-card ${isOverdue ? "is-overdue" : ""}`}
                >
                  <div className="dashboard-reminder-head">
                    <div>
                      <h4>{tx.villagerName}</h4>
                      <p>{tx.village?.name || "Unknown village"}</p>
                    </div>
                    <span
                      className={`badge ${isOverdue ? "badge-overdue" : "badge-pending"}`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="dashboard-reminder-stats">
                    <div>
                      <span>{t.cansDue}</span>
                      <strong>{remaining}</strong>
                    </div>
                    <div>
                      <span>{t.duePay}</span>
                      <strong>₹{tx.amountDue}</strong>
                    </div>
                  </div>

                  <div className="dashboard-reminder-timer">
                    <Clock3 size={14} />
                    <span>{getRemainingTimeText(tx.dueAt)}</span>
                  </div>

                  <a
                    href={getWhatsAppLink(tx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dashboard-whatsapp-btn"
                  >
                    <MessageSquare size={14} />
                    <span>{t.sendReminder}</span>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
