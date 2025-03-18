import { useState } from "react";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Chỉ dùng khi đăng ký
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth); // Lấy trạng thái từ Redux
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Đăng nhập
        await dispatch(loginUser({ email, password })).unwrap();
        navigate("/");
      } else {
        // Đăng ký
        await dispatch(registerUser({ username, password })).unwrap();
        navigate("/");
      }
    } catch (err) {
      console.error(`${isLogin ? "Login" : "Register"} failed:`, err);
      alert(
        isLogin
          ? "Login failed: Invalid credentials"
          : "Register failed: Username may already exist"
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <div className="bg-[#222222] p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Sign In" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <FaUser />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </label>
            </div>
          )}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <FaEnvelope />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
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
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading} // Vô hiệu hóa khi đang xử lý
            className="w-full bg-white text-gray-900 hover:bg-gray-300 py-2 rounded-full disabled:bg-gray-500"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
          {error && (
            <p className="text-red-500 text-center mt-2">
              {isLogin ? "Invalid credentials" : "Registration failed"}
            </p>
          )}
        </form>
        <p className="text-center mt-4 text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            className="text-gray-200 cursor-pointer hover:underline ml-1"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}