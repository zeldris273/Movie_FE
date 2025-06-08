import { useState, useEffect } from "react";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, logoutUser } from "../store/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import Swal from "sweetalert2";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[\W_]/.test(password);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const showAlert = (title, text, icon) => {
    Swal.fire({
      title,
      text,
      icon,
      background: "#222222",
      color: "#fff",
      confirmButtonColor: "#ffcc00",
    });
  };

  const handleSendOtp = async () => {
    if (!email || !validateEmail(email)) {
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }
    try {
      const endpoint = isForgotPassword ? "/api/auth/forgot-password" : "/api/auth/send-otp";
      const response = await api.post(endpoint, { email }, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setIsOtpSent(true);
        showAlert(
          "OTP Sent",
          "OTP sent to your email. Please check your inbox.",
          "success"
        );
      }
    } catch (err) {
      showAlert(
        "Failed to Send OTP",
        err.response?.data || err.message,
        "error"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      showAlert(
        "Weak Password",
        "Password must be at least 6 characters long, include uppercase, lowercase, a number, and a special character.",
        "warning"
      );
      return;
    }

    try {
      if (isForgotPassword) {
        const response = await api.post("/api/auth/reset-password", {
          email,
          otp,
          password,
        }, {
          withCredentials: true,
        });
        if (response.status === 200) {
          showAlert(
            "Success",
            "Password reset successfully. Please login with your new password.",
            "success"
          );
          setIsForgotPassword(false);
          setIsLogin(true);
          setIsOtpSent(false);
          setEmail("");
          setPassword("");
          setOtp("");
        }
      } else if (isLogin) {
        await dispatch(loginUser({ email, password })).unwrap();
        console.log('After login, localStorage accessToken:', {
          accessToken: localStorage.getItem('accessToken'),
        });
        navigate("/");
      } else {
        if (!isOtpSent) {
          showAlert("OTP Required", "Please send OTP first.", "warning");
          return;
        }
        await dispatch(registerUser({ email, password, otp })).unwrap();
        console.log('After register, localStorage accessToken:', {
          accessToken: localStorage.getItem('accessToken'),
        });
        navigate("/");
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      showAlert(
        "Error",
        isForgotPassword
          ? "Failed to reset password: " + (err.response?.data || err.message)
          : isLogin
          ? "Invalid credentials: " + (err || "Unknown error")
          : "Invalid OTP or registration failed: " + (err || "Unknown error"),
        "error"
      );
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/auth");
    } catch (err) {
      showAlert("Logout Failed", err || "Unknown error", "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <div className="bg-[#222222] p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isForgotPassword ? "Forgot Password" : isLogin ? "Sign In" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <FaLock />
              <input
                type="password"
                placeholder={isForgotPassword ? "New Password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </label>
          </div>
          {(isForgotPassword || !isLogin) && (
            <div className="flex items-center justify-between mb-4">
              <div className="w-[150px]">
                <label className="flex items-center gap-2">
                  <FaLock />
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || isOtpSent}
                className="bg-yellow-600 text-white px-4 py-2 rounded-2xl hover:bg-orange-500 disabled:bg-gray-500"
              >
                Send OTP
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 hover:bg-gray-300 py-2 rounded-full disabled:bg-gray-500"
          >
            {loading ? "Processing..." : isForgotPassword ? "Reset Password" : isLogin ? "Login" : "Register"}
          </button>
          {error && (
            <p className="text-red-500 text-center mt-2">
              {isForgotPassword ? "Password reset failed" : isLogin ? "Invalid credentials" : "Registration failed"}: {error}
            </p>
          )}
          {(isForgotPassword || !isLogin) && isOtpSent && (
            <p className="text-green-500 text-center mt-2">
              OTP sent to your email. Please check your inbox.
            </p>
          )}
        </form>
        <p className="text-center mt-4 text-gray-400">
          {isForgotPassword ? (
            <>
              Back to{" "}
              <span
                className="text-gray-200 cursor-pointer hover:underline"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setIsOtpSent(false);
                  setEmail("");
                  setPassword("");
                  setOtp("");
                }}
              >
                Sign In
              </span>
            </>
          ) : isLogin ? (
            <>
              Don't have an account?{" "}
              <span
                className="text-gray-200 cursor-pointer hover:underline"
                onClick={() => {
                  setIsLogin(false);
                  setIsOtpSent(false);
                }}
              >
                Sign Up
              </span>
              <br />
              Forgot your password?{" "}
              <span
                className="text-gray-200 cursor-pointer hover:underline"
                onClick={() => {
                  setIsForgotPassword(true);
                  setIsOtpSent(false);
                  setEmail("");
                  setPassword("");
                  setOtp("");
                }}
              >
                Forgot Password
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-gray-200 cursor-pointer hover:underline"
                onClick={() => {
                  setIsLogin(true);
                  setIsOtpSent(false);
                }}
              >
                Sign In
              </span>
            </>
          )}
        </p>
        {isLogin && !isForgotPassword && localStorage.getItem("accessToken") && (
          <p className="text-center mt-4">
            <button
              onClick={handleLogout}
              className="text-gray-200 cursor-pointer hover:underline"
            >
              Logout
            </button>
          </p>
        )}
      </div>
    </div>
  );
}