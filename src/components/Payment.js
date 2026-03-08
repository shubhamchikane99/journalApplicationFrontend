import React, { useState, useContext, useEffect } from "react";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/Payment.css";
import NavBar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const { logout } = useContext(AuthContext); // ✅ Hook inside component
  const navigate = useNavigate();
  const [errors, setError] = useState(""); // State to manage errors
  const [plans, setPlans] = useState([]);

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };

  const createOrder = async () => {
    if (!selectedPlan) {
      alert("Please select a plan first!");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchData(
        `${endPoint.payment}/create-order?amount=${selectedPlan.amountInPaise}`,
      );

      console.log("data " + JSON.stringify(data));

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

  //get All Journal Entry
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
            features: p.planFeature?.map((f) => f.name) || [],
            popular: p.isPopuler === 1,
          }));
          setPlans(formattedPlans);
        }
      } catch (err) {
        setError("Failed to fetch Journal Entry. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  const openRazorpay = (order) => {
    const options = {
      key: "rzp_test_SOHpNn6izxFQhc",
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
      const verifyData = await fetchData(
        `${endPoint.payment}/verify-payment`,
        "POST",
        {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          planId: selectedPlan.id,
        },
      );
      if (verifyData?.success) {
        alert("Payment successful! Plan activated.");
      } else {
        alert("Verification failed.");
      }
    } catch (err) {
      console.error("Verify error:", err);
      alert("Verification failed.");
    }
  };

  return (
    <div>
      <NavBar onLogout={handleLogout} />
      {errors && <div className="error-message">{errors}</div>}
      <div className="pricing-container">
        <div className="pricing-content">
          <div className="header-text">
            <h1>Choose Your Plan</h1>
            <p>Unlock full messaging features in seconds.</p>
          </div>

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
                  <span className="period">/month</span>
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
