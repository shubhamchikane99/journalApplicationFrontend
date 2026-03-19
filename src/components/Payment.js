import React, { useState, useContext, useEffect } from "react";
import { fetchData, postData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/Payment.css";
import NavBar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [errors, setError] = useState("");
  const [plans, setPlans] = useState([]);

  // ── Active plan state ──────────────────────────────────────────────────────
  const [activePlan, setActivePlan] = useState(null); // holds { id, name, description, daysCount }
  const [showActiveBanner, setShowActiveBanner] = useState(false); // controls the modal

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Fetch all available plans ──────────────────────────────────────────────
  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const data = await fetchData(`${endPoint.plan}/active`);
        if (data.data) {
          const formattedPlans = data.data.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            amountInPaise: p.price,
            description: p.description,
            duration: p.duration,
            features: p.planFeature?.map((f) => f.name) || [],
            popular: p.isPopuler === 1,
            accessFeatures: p.accessFeatures,
          }));
          setPlans(formattedPlans);
        }
      } catch (err) {
        setError("Failed to fetch plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  // ── Fetch logged-in user from localStorage ─────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setLoggedInUser(user);
  }, []);

  // ── Fetch user's active plan once loggedInUser is available ───────────────
  // API response: { id, name, description, daysCount }
  // daysCount starts positive (e.g. "364") and BE decrements it daily.
  // daysCount > 0  → plan still active  → block new purchase & show modal
  // daysCount <= 0 → plan expired       → allow purchase normally
  useEffect(() => {
    if (!loggedInUser?.id) return;

    const fetchUserPlan = async () => {
      try {
        const data = await fetchData(
          `${endPoint.plan}/by-user?userId=${loggedInUser.id}`,
        );

        // Number() safely handles string values like "364"
        if (data.data && Number(data.data.daysCount) > 0) {
          setActivePlan(data.data);
        }
      } catch (err) {
        // silently ignore — user may simply not have a plan yet
        console.error("Failed to fetch user plan:", err);
      }
    };

    fetchUserPlan();
  }, [loggedInUser]);

  // ── Payment flow ───────────────────────────────────────────────────────────
  const createOrder = async () => {
    if (!selectedPlan) {
      alert("Please select a plan first!");
      return;
    }

    // Guard: if user already has an active plan, show the modal instead
    if (activePlan) {
      setShowActiveBanner(true);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchData(
        `${endPoint.payment}/create-order?amount=${selectedPlan.amountInPaise}`,
      );

      if (data.data?.id) {
        openRazorpay(data.data);
      } else {
        alert("Failed to create order.");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = (order) => {
    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Chat Application",
      description: selectedPlan.name,
      order_id: order.id,
      handler: function (response) {
        verifyPayment(response);
      },
      theme: { color: "#4f46e5" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const verifyPayment = async (response) => {
    try {
      const payload = {
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        accesJson: selectedPlan.accessFeatures,
        planName: selectedPlan.name,
      };
      const verifyData = await postData(
        endPoint.payment + "/verify-payment",
        payload,
      );

      if (verifyData?.data) {
        alert("Payment successful! Plan activated.");
        window.location.reload();
      } else {
        alert("Verification failed.");
      }
    } catch (err) {
      console.error("Verify error:", err);
      alert("Verification failed.");
    }
  };

  // ── Already-purchased modal ────────────────────────────────────────────────
  const ActivePlanBanner = () => (
    <div
      className="active-plan-overlay"
      onClick={() => setShowActiveBanner(false)}
    >
      <div className="active-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="active-plan-icon">🎉</div>

        <h2 className="active-plan-title">You Already Have an Active Plan!</h2>
        <p className="active-plan-subtitle">
          Your current subscription is still active. You don't need to purchase
          a new plan yet.
        </p>

        {activePlan && (
          <div className="active-plan-details">
            <div className="active-plan-detail-row">
              <span className="detail-label">Plan</span>
              <span className="detail-value">
                {activePlan.name || "Current Plan"}
              </span>
            </div>
            <div className="active-plan-detail-row">
              <span className="detail-label">Days Remaining</span>
              <span className="detail-value highlight">
                {Number(activePlan.daysCount)} day
                {Number(activePlan.daysCount) !== 1 ? "s" : ""}
              </span>
            </div>
            {activePlan.expiryDate && (
              <div className="active-plan-detail-row">
                <span className="detail-label">Expires On</span>
                <span className="detail-value">
                  {new Date(activePlan.expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          className="active-plan-close-btn"
          onClick={() => setShowActiveBanner(false)}
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {loading && <Loader />}
      <NavBar onLogout={handleLogout} />

      {/* Already-purchased modal */}
      {showActiveBanner && <ActivePlanBanner />}

      {errors && <div className="error-message">{errors}</div>}

      <div className="pricing-container">
        <div className="pricing-content">
          <div className="header-text">
            <h1>Choose Your Plan</h1>
            <p>Unlock full messaging features in seconds.</p>
          </div>

          {/* Subtle top banner shown when user already has an active plan */}
          {activePlan && (
            <div className="active-plan-topbar">
              <span>
                ✅ You have an active plan — <strong>{activePlan.name}</strong>
              </span>
              <span className="topbar-days">
                {Number(activePlan.daysCount)} day
                {Number(activePlan.daysCount) !== 1 ? "s" : ""} remaining
              </span>
            </div>
          )}

          <div className="plans-grid">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${
                  plan.popular ? "popular" : ""
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <span className="popular-badge">Most Popular</span>
                )}

                <h3 className="plan-name">{plan.name}</h3>

                <div className="price-wrapper">
                  <span className="price">₹{plan.price}</span>
                  <span className="period">/{plan.duration} Day</span>
                </div>

                <p className="plan-description">{plan.description}</p>

                <ul className="features-list">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span className="checkmark">✓</span> {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan?.id === plan.id && (
                  <div className="selected-indicator">Selected Plan</div>
                )}
              </div>
            ))}
          </div>

          <div className="pay-section">
            <button
              className={`pay-button ${loading || !selectedPlan ? "disabled" : ""}`}
              onClick={createOrder}
              disabled={loading || !selectedPlan}
            >
              {loading
                ? "Processing..."
                : selectedPlan
                  ? `Pay ₹${selectedPlan.price} & Unlock Now`
                  : "Select a Plan to Continue"}
            </button>

            <p className="security-note">
              Secured payments • Instant access • Powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
