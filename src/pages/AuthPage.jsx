import { useState } from "react";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email) {
      alert("Please enter an email address.");
      return;
    }
    try {
      console.log("Sending send-otp request:", { email });
      const response = await axios.post("http://localhost:5116/api/auth/send-otp", { email });
      console.log("Send-otp response:", response.data);
      if (response.status === 200) {
        setIsOtpSent(true);
        alert("OTP sent to your email. Please check your inbox.");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err.response?.data || err.message);
      alert("Failed to send OTP: " + (err.response?.data || err.message));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await dispatch(loginUser({ email, password })).unwrap();
        navigate("/");
      } else {
        if (!isOtpSent) {
          alert("Please send OTP first.");
          return;
        }
        const response = await axios.post("http://localhost:5116/api/auth/verify-otp", {
          email,
          password,
          otp,
        });
        if (response.status === 200) {
          await dispatch(loginUser({ email, password })).unwrap();
          navigate("/");
        }
      }
    } catch (err) {
      alert("Invalid OTP or registration failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <div className="bg-[#222222] p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Sign In" : "Sign Up"}
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </label>
          </div>
          {!isLogin && (
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
                disabled={loading || isOtpSent} // Vô hiệu hóa sau khi gửi
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
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
          {error && (
            <p className="text-red-500 text-center mt-2">
              {isLogin ? "Invalid credentials" : "Registration failed"}
            </p>
          )}
          {!isLogin && isOtpSent && (
            <p className="text-green-500 text-center mt-2">
              OTP sent to your email. Please check your inbox.
            </p>
          )}
        </form>
        <p className="text-center mt-4 text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            className="text-gray-200 cursor-pointer hover:underline ml-1"
            onClick={() => {
              setIsLogin(!isLogin);
              setIsOtpSent(false); // Reset khi chuyển form
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}