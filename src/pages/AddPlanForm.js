// AddPlanForm.jsx
import { useState, useEffect, useContext } from "react";
import "../styles/AddPlanForm.css";
import { endPoint } from "../services/endPoint";
import { postData, fetchData } from "../services/apiService";
import NavBar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const DURATION_OPTIONS = [
  { label: "15 Days", value: 15 },
  { label: "30 Days", value: 30 },
  { label: "1 Year (365 Days)", value: 365 },
];

export default function AddPlanForm() {
  const [features, setFeatures] = useState([""]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    popular: false,
    isActive: true,
    duration: "", // ← new field
  });

  const [featureError, setFeatureError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accessFeatures, setAccessFeatures] = useState([
    { key: "", value: true },
  ]);
  const [accessFeatureError, setAccessFeatureError] = useState("");
  const [accessFeatureOptions, setAccessFeatureOptions] = useState([]);

  const addFeature = () => {
    const lastFeature = features[features.length - 1]?.trim() || "";
    if (lastFeature === "") {
      setFeatureError(
        "Please fill in the current feature before adding a new one.",
      );
      return;
    }
    setFeatureError("");
    setFeatures([...features, ""]);
  };

  const removeFeature = (index) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
      setFeatureError("");
    }
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
    if (value.trim() !== "" && featureError) setFeatureError("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Display Name is required";
    if (!formData.price || Number(formData.price) <= 0)
      errors.price = "Valid price (greater than 0) is required";
    if (!formData.duration) errors.duration = "Please select a plan duration";
    const cleaned = features.filter((f) => f.trim() !== "");
    if (cleaned.length === 0)
      errors.features = "At least one feature is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;

    const accessFeaturesJson = accessFeatures
      .filter((f) => f.key.trim() !== "")
      .reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {});

    const cleanedFeatures = features
      .filter((f) => f.trim() !== "")
      .map((f) => f.trim());
    const payload = {
      ...formData,
      isPopuler: formData.popular ? 1 : 0,
      price: Number(formData.price),
      duration: Number(formData.duration),
      planFeature: cleanedFeatures.map((text) => ({ name: text })),
      isActive: formData.isActive ? 1 : 0,
      accessFeatures: JSON.stringify(accessFeaturesJson),
    };

    setIsLoading(true);
    try {
      let response;
      if (editingPlanId) {
        payload.id = editingPlanId;
        response = await postData(endPoint.plan, payload);
      } else {
        response = await postData(endPoint.plan, payload);
      }

      if (response?.error || response?.data?.error) {
        setApiError(response.data?.errorMessage || "Failed to save plan.");
        return;
      }

      if (response?.data) {
        alert(
          editingPlanId
            ? "Plan updated successfully!"
            : "Plan created successfully!",
        );
        setEditingPlanId(null);
        setFormData({
          name: "",
          price: "",
          description: "",
          popular: false,
          isActive: true,
          duration: "",
        });
        setFeatures([""]);
        setFormErrors({});
        setFeatureError("");
        setApiError("");

        const freshResponse = await fetchData(endPoint.plan + "/get-all");
        if (freshResponse?.data) setPlans(freshResponse.data || []);
      }
    } catch (err) {
      console.error("Save error:", err);
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const response = await fetchData(`${endPoint.plan}/get-all`);
        if (response?.error || response?.data?.error) {
          console.error("Failed to fetch plans:", response.data?.errorMessage);
          return;
        }
        const planList =
          response.data || response.data?.plans || response.data?.result || [];
        setPlans(planList);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditClick = (plan) => {
    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name || "",
      price: plan.price || "",
      description: plan.description || "",
      popular: !!plan.popular,
      isActive: plan.isActive !== undefined ? !!plan.isActive : true,
      duration: plan.duration ? String(plan.duration) : "",
    });
    setFeatures(
      plan.planFeature && plan.planFeature.length > 0
        ? plan.planFeature.map((f) => f.name)
        : [""],
    );

    // ← add this block
    if (plan.accessFeatures) {
      try {
        const parsed =
          typeof plan.accessFeatures === "string"
            ? JSON.parse(plan.accessFeatures)
            : plan.accessFeatures;
        // Convert object back to array for the UI
        const asArray = Object.entries(parsed).map(([key, value]) => ({
          key,
          value,
        }));
        setAccessFeatures(
          asArray.length > 0 ? asArray : [{ key: "", value: true }],
        );
      } catch {
        setAccessFeatures([{ key: "", value: true }]);
      }
    }

    setFormErrors({});
    setFeatureError("");
    setApiError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setFormData({
      name: "",
      price: "",
      description: "",
      popular: false,
      isActive: true,
      duration: "",
    });
    setFeatures([""]);
    setAccessFeatures({
      // ← add this
      CHAT: false,
      AI_CHAT: false,
      FILE_SHARE: false,
      GROUP_CHAT: false,
      VIDEO_CALL: false,
    });
    setFormErrors({});
    setFeatureError("");
    setApiError("");
  };

  const handleDeleteConfirm = async (planId) => {
    setIsDeleting(true);
    setLoading(true);
    try {
      const response = await postData(`${endPoint.plan}/delete/${planId}`, {});
      if (response?.error || response?.data?.error) {
        setApiError(response.data?.errorMessage || "Failed to delete plan.");
        setDeleteConfirmId(null);
        return;
      }
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      setDeleteConfirmId(null);
      if (editingPlanId === planId) handleCancelEdit();

      const freshResponse = await fetchData(endPoint.plan + "/get-all");
      if (freshResponse?.data) setPlans(freshResponse.data || []);
    } catch (err) {
      console.error("Delete error:", err);
      setApiError(err.message || "Failed to delete plan. Please try again.");
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  const getInitials = (name = "") =>
    name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const getDurationLabel = (days) => {
    const opt = DURATION_OPTIONS.find((o) => o.value === Number(days));
    return opt ? opt.label : days ? `${days} Days` : "—";
  };

  // plan features
  const addAccessFeature = () => {
    const last = accessFeatures[accessFeatures.length - 1];
    if (!last?.key?.trim()) {
      setAccessFeatureError(
        "Please fill in the current feature before adding a new one.",
      );
      return;
    }
    setAccessFeatureError("");
    setAccessFeatures([...accessFeatures, { key: "", value: true }]);
  };

  const removeAccessFeature = (index) => {
    if (accessFeatures.length > 1) {
      setAccessFeatures(accessFeatures.filter((_, i) => i !== index));
      setAccessFeatureError("");
    }
  };

  const updateAccessFeatureKey = (index, newKey) => {
    const updated = [...accessFeatures];
    updated[index] = { ...updated[index], key: newKey };
    setAccessFeatures(updated);
    if (newKey.trim() && accessFeatureError) setAccessFeatureError("");
  };

  const toggleAccessFeatureValue = (index) => {
    const updated = [...accessFeatures];
    updated[index].value = !updated[index].value;
    setAccessFeatures(updated);
  };

  useEffect(() => {
    const fetchAccessFeatureOptions = async () => {
      try {
        const response = await fetchData(
          endPoint.userAccessFeature + "/get-all",
        );
        const rawData = response?.data ?? response;
        if (Array.isArray(rawData)) {
          const keys = rawData
            .filter((item) => item.isActive === "1") // ← string "1" not number 1
            .map((item) => item.name)
            .filter(Boolean);
          setAccessFeatureOptions(keys);
        }
      } catch (err) {
        console.error("Error fetching access feature options:", err);
      }
    };
    fetchAccessFeatureOptions();
  }, []);

  return (
    <div>
      <NavBar onLogout={handleLogout} />
      {loading && <Loader />}

      <div className="page-content">
        {/* ── Form Card ──────────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">{editingPlanId ? "✏️" : "✦"}</div>
            <div className="card-header-text">
              <h1>{editingPlanId ? "Edit Plan" : "Create New Plan"}</h1>
              <p>
                {editingPlanId
                  ? "Update pricing, features and visibility"
                  : "Define pricing, features and visibility"}
              </p>
            </div>
            <div className={`mode-badge ${editingPlanId ? "edit" : "create"}`}>
              <span className="dot" />
              {editingPlanId ? "Edit Mode" : "Create Mode"}
            </div>
          </div>

          {apiError && <div className="api-error-message">{apiError}</div>}

          <form onSubmit={handleSubmit} className="plan-form" noValidate>
            <div className="form-grid">
              {/* ── Left column ──────────────────────────────────────────────── */}
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="name">Display Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Pro Plan"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={formErrors.name ? "input-error" : ""}
                  />
                  {formErrors.name && (
                    <span className="error-text">{formErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price (in paise) *</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 29900 = ₹299"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className={formErrors.price ? "input-error" : ""}
                  />
                  {formErrors.price && (
                    <span className="error-text">{formErrors.price}</span>
                  )}
                </div>

                {/* ── Duration dropdown ──────────────────────────────────────── */}
                <div className="form-group">
                  <label htmlFor="duration">Plan Duration *</label>
                  <div className="select-wrapper">
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className={`duration-select${formErrors.duration ? " input-error" : ""}${formData.duration ? " has-value" : ""}`}
                    >
                      <option value="" disabled>
                        Select duration…
                      </option>
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                  {formErrors.duration && (
                    <span className="error-text">{formErrors.duration}</span>
                  )}
                </div>
                {/* ──────────────────────────────────────────────────────────── */}

                {/* Popular toggle */}
                <div className="form-group checkbox-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      name="popular"
                      checked={formData.popular}
                      onChange={handleChange}
                    />
                    <div className="toggle-content">
                      <span className="toggle-icon">⭐</span>
                      <div className="toggle-track" />
                      <div className="toggle-text">
                        <span className="toggle-title">Most Popular</span>
                        <span className="toggle-desc">
                          Highlight this plan for users
                        </span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Active toggle */}
                <div className="form-group checkbox-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <div className="toggle-content">
                      <span className="toggle-icon">👁</span>
                      <div className="toggle-track" />
                      <div className="toggle-text">
                        <span className="toggle-title">Publicly Visible</span>
                        <span className="toggle-desc">
                          Show this plan to users
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Right column ─────────────────────────────────────────────── */}
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Best choice for growing teams and power users..."
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <span className="features-section-label">Features *</span>
                  <div className="features-list">
                    {features.map((feature, index) => (
                      <div key={index} className="feature-row">
                        <span className="feature-row-num">{index + 1}</span>
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="e.g. Unlimited messages"
                        />
                        {features.length > 1 && (
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removeFeature(index)}
                            aria-label="Remove feature"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {featureError && (
                    <span className="error-text">{featureError}</span>
                  )}
                  {formErrors.features && (
                    <span className="error-text">{formErrors.features}</span>
                  )}

                  <button
                    type="button"
                    className="add-feature-btn"
                    onClick={addFeature}
                    disabled={isLoading}
                  >
                    + Add another feature
                  </button>
                </div>

                {/* ── Access Features (JSON flags) ──────────────────────────── */}
                <div className="form-group">
                  <span className="features-section-label">
                    Access Features
                  </span>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--slate-500)",
                      marginBottom: "10px",
                    }}
                  >
                    Add custom feature keys this plan unlocks (e.g. AI_CHAT,
                    VIDEO_CALL)
                  </p>

                  <div className="features-list">
                    {accessFeatures.map((af, index) => (
                      <div
                        key={index}
                        className="feature-row"
                        style={{ alignItems: "center", gap: "8px" }}
                      >
                        <span className="feature-row-num">{index + 1}</span>

                        <select
                          value={af.key}
                          onChange={(e) =>
                            updateAccessFeatureKey(index, e.target.value)
                          }
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "7px 10px",
                            borderRadius: "8px",
                            border: "1.5px solid var(--slate-300)",
                            fontSize: "0.85rem",
                            background: "var(--white)",
                            color: af.key
                              ? "var(--slate-800)"
                              : "var(--slate-400)",
                          }}
                        >
                          <option value="" disabled>
                            Select feature…
                          </option>
                          {accessFeatureOptions
                            .filter(
                              (opt) =>
                                opt === af.key || // always show the currently selected value of THIS row
                                !accessFeatures.some(
                                  (other) => other.key === opt,
                                ), // hide if selected in another row
                            )
                            .map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleAccessFeatureValue(index)}
                          style={{
                            flexShrink: 0,
                            width: "72px",
                            padding: "6px 0",
                            borderRadius: "12px",
                            border: "1.5px solid",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            background: af.value ? "#6366f1" : "transparent",
                            borderColor: af.value
                              ? "#6366f1"
                              : "var(--slate-300)",
                            color: af.value ? "#fff" : "var(--slate-500)",
                          }}
                        >
                          {af.value ? "✓ On" : "✕ Off"}
                        </button>

                        {accessFeatures.length > 1 && (
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removeAccessFeature(index)}
                            aria-label="Remove"
                            style={{ flexShrink: 0 }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {accessFeatureError && (
                    <span className="error-text">{accessFeatureError}</span>
                  )}

                  <button
                    type="button"
                    className="add-feature-btn"
                    onClick={addAccessFeature}
                    disabled={isLoading}
                  >
                    + Add access feature
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className={`btn secondary${editingPlanId ? " is-editing" : ""}`}
                disabled={isLoading}
                onClick={editingPlanId ? handleCancelEdit : undefined}
              >
                {editingPlanId ? "✕ Cancel Edit" : "Cancel"}
              </button>

              <button
                type="submit"
                className="btn primary"
                disabled={isLoading}
              >
                {isLoading
                  ? editingPlanId
                    ? "Updating…"
                    : "Saving…"
                  : editingPlanId
                    ? "✓ Update Plan"
                    : "✦ Create Plan"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Plans Table Card ─────────────────────────────────────────────── */}
        <div className="plans-section card">
          <div className="card-header">
            <div className="card-header-icon">📋</div>
            <div className="card-header-text">
              <h2>Existing Plans</h2>
              <p>
                {plans.length} plan{plans.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>

          <div className="plans-list-container">
            {plans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✦</div>
                <p>
                  <strong>No plans yet.</strong>
                </p>
                <p>Create your first subscription plan above to get started.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Price (₹)</th>
                    <th>Duration</th>
                    <th>Popular</th>
                    <th>Status</th>
                    <th>Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, idx) => (
                    <tr
                      key={idx}
                      className={
                        editingPlanId === plan.id ? "is-editing-row" : ""
                      }
                    >
                      <td>
                        <div className="plan-name-cell">
                          <div className="plan-avatar">
                            {getInitials(plan.name)}
                          </div>
                          <span className="plan-name-text">{plan.name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="price-pill">
                          <span className="currency">₹</span>
                          {plan.price.toFixed(2)}
                        </span>
                      </td>

                      {/* Duration column */}
                      <td>
                        <span className="duration-pill">
                          🕐 {getDurationLabel(plan.duration)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${plan.popular ? "yes" : "no"}`}
                        >
                          <span className="badge-dot" />
                          {plan.popular ? "Popular" : "Standard"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${plan.isActive ? "yes" : "no"}`}
                        >
                          <span className="badge-dot" />
                          {plan.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>

                      <td>
                        <div className="features-chips">
                          {plan.planFeature && plan.planFeature.length > 0 ? (
                            plan.planFeature.slice(0, 3).map((f, i) => (
                              <span
                                key={i}
                                className="feature-chip"
                                title={f.name}
                              >
                                {f.name}
                              </span>
                            ))
                          ) : (
                            <span
                              style={{
                                color: "var(--slate-500)",
                                fontSize: "0.85rem",
                              }}
                            >
                              —
                            </span>
                          )}
                          {plan.planFeature?.length > 3 && (
                            <span className="feature-chip">
                              +{plan.planFeature.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {deleteConfirmId === plan.id ? (
                          <div className="delete-confirm">
                            <span className="delete-confirm-text">Delete?</span>
                            <button
                              className="confirm-btn yes"
                              onClick={() => handleDeleteConfirm(plan.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "…" : "Yes"}
                            </button>
                            <button
                              className="confirm-btn no"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="action-cell">
                            <button
                              className={`action-btn edit${editingPlanId === plan.id ? " active" : ""}`}
                              onClick={() => handleEditClick(plan)}
                              disabled={isLoading || isDeleting}
                            >
                              {editingPlanId === plan.id
                                ? "Editing…"
                                : "✏ Edit"}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => setDeleteConfirmId(plan.id)}
                              disabled={isLoading || isDeleting}
                            >
                              ✕ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
