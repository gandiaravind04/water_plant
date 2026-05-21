import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Home,
  MapPin,
  Droplet,
  Sun,
  Moon,
  Languages,
  LoaderCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const Settings = () => {
  const { theme, toggleTheme, lang, toggleLang, t, fontSize, setFontSize } =
    useApp();
  const [villages, setVillages] = useState([]);
  const [newVillage, setNewVillage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [canPrice, setCanPrice] = useState(20);
  const [priceInput, setPriceInput] = useState(20);
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  const authCfg = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchProfile = async () => {
    try {
      const r = await axios.get(
        import.meta.env.VITE_API_URL + "/api/auth/profile",
        authCfg(),
      );
      setCanPrice(r.data.canPrice || 20);
      setPriceInput(r.data.canPrice || 20);
      localStorage.setItem("canPrice", r.data.canPrice || 20);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVillages = async () => {
    try {
      const r = await axios.get(
        import.meta.env.VITE_API_URL + "/api/villages",
        authCfg(),
      );
      setVillages(r.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVillages();
    fetchProfile();
  }, []);

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    setPriceError("");
    setPriceSuccess("");
    setPriceLoading(true);
    try {
      const r = await axios.put(
        import.meta.env.VITE_API_URL + "/api/auth/profile",
        { canPrice: Number(priceInput) },
        authCfg(),
      );
      setCanPrice(r.data.canPrice);
      setPriceInput(r.data.canPrice);
      localStorage.setItem("canPrice", r.data.canPrice);
      setPriceSuccess(t.saveCanPrice + " ✓");
      setTimeout(() => setPriceSuccess(""), 3000);
    } catch (err) {
      setPriceError(
        err.response?.data?.message || "Failed to update can price",
      );
    } finally {
      setPriceLoading(false);
    }
  };

  const handleAddVillage = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newVillage.trim()) return;
    setLoading(true);
    try {
      const r = await axios.post(
        import.meta.env.VITE_API_URL + "/api/villages",
        { name: newVillage },
        authCfg(),
      );
      setSuccess(`"${r.data.name}" added ✓`);
      setNewVillage("");
      fetchVillages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add village");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVillage = async (id, name) => {
    if (
      !window.confirm(
        `Delete "${name}"?\nAll records linked to this village will also be deleted.`,
      )
    )
      return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/villages/${id}`,
        authCfg(),
      );
      setSuccess(`"${name}" deleted.`);
      fetchVillages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete village");
    }
  };

  const Alert = ({ msg, type }) =>
    msg ? (
      <div
        style={{
          background:
            type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
          color:
            type === "error"
              ? "var(--status-overdue)"
              : "var(--status-returned)",
          border: `1px solid ${type === "error" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "14px",
        }}
      >
        {msg}
      </div>
    ) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="glow-text-cyan">{t.systemSettings}</h1>
      </div>

      {/* Appearance Panel */}
      <div
        className="glass-panel"
        style={{ padding: "26px", marginBottom: "24px" }}
      >
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Sun size={18} className="glow-text-cyan" />
          {t.appearance}
        </h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Theme Toggle */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              {t.theme}
            </label>
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px",
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme === "dark" ? t.lightMode : t.darkMode}
            </button>
          </div>
          {/* Font size */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              {t.fontSizeLabel}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min="12"
                max="28"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="glass-input"
                style={{ width: "110px" }}
              />
              <div
                style={{ alignSelf: "center", color: "var(--text-secondary)" }}
              >
                {t.fontSizeUnit}
              </div>
            </div>
          </div>
          {/* Language Toggle */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              {t.language}
            </label>
            <button
              onClick={toggleLang}
              className="btn-secondary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px",
              }}
            >
              <Languages size={18} />
              {lang === "en" ? "తెలుగుకు మారు" : "Switch to English"}
            </button>
          </div>
        </div>
      </div>

      {/* Can Price Panel */}
      <div
        className="glass-panel"
        style={{ padding: "26px", marginBottom: "24px" }}
      >
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Droplet size={18} className="glow-text-cyan" />
          {t.canPriceConfig}
        </h3>
        <Alert msg={priceError} type="error" />
        <Alert msg={priceSuccess} type="success" />
        <form
          onSubmit={handleUpdatePrice}
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1", minWidth: "180px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              {t.standardCanPrice}
            </label>
            <input
              type="number"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(Number(e.target.value))}
              placeholder="e.g. 20"
              className="glass-input"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ height: "46px", padding: "0 28px" }}
            disabled={priceLoading}
          >
            {priceLoading && <LoaderCircle size={16} className="inline-spinner" />}
            <span>{priceLoading ? t.saving : t.saveCanPrice}</span>
          </button>
        </form>
      </div>

      <div className="settings-grid">
        {/* Add Village */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <h3
            style={{
              fontSize: "18px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} className="glow-text-cyan" />
            {t.addNewVillage}
          </h3>
          <Alert msg={error} type="error" />
          <Alert msg={success} type="success" />
          <form
            onSubmit={handleAddVillage}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                {t.villageName}
              </label>
              <div style={{ position: "relative" }}>
                <Home
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "14px",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  placeholder={t.villagePlaceholder}
                  className="glass-input"
                  style={{ paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading && <LoaderCircle size={16} className="inline-spinner" />}
              <span>{loading ? t.adding : t.addVillage}</span>
            </button>
          </form>
        </div>

        {/* Villages List */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <h3
            style={{
              fontSize: "18px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MapPin size={18} className="glow-text-cyan" />
            {t.servicedVillages} ({villages.length})
          </h3>
          <div
            style={{
              maxHeight: "380px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingRight: "4px",
            }}
          >
            {villages.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                {t.noVillages}
              </div>
            ) : (
              villages.map((v) => (
                <div
                  key={v._id}
                  className="glass-panel"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "var(--village-item-bg)",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: "500" }}>
                    {v.name}
                  </span>
                  <button
                    onClick={() => handleDeleteVillage(v._id, v.name)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--status-overdue)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
