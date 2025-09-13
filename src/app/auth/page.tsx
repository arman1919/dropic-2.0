"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/client";
import "@/styles/pages/Auth.css";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/login" : "/register";

      const authData: Record<string, string> = {
        email,
        password,
      };
      if (!isLogin && username) {
        authData.username = username;
      }

      const response = await api.post(`/api/users${endpoint}`, authData);

      if (response.data.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("userToken", response.data.token);
          localStorage.setItem("email", email);
        }
        router.push("/");
      } else if (response.data.success) {
        if (isLogin) {
          setError("The server did not return an auth token");
        } else {
          setIsLogin(true);
          setError("Registration successful! You can now log in.");
          setEmail("");
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      console.error("Response data:", err.response?.data);

      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password");
        } else if (err.response.status === 409) {
          setError(err.response.data?.message || "User already exists");
        } else {
          const errorMessage =
            err.response.data?.message ||
            err.response.data?.error ||
            "An error occurred during authentication";
          setError(errorMessage);
        }
      } else if (err.request) {
        setError("Server is unavailable. Please check your connection");
      } else {
        setError("An error occurred while sending the request");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{isLogin ? "Log in" : "Sign up"}</h1>
        </div>

        {error && <div className="notification error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Repeat password"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? "Loading..."
                : isLogin
                ? "Log in"
                : "Sign up"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="secondary-button"
              disabled={loading}
            >
              {isLogin ? "Create an account" : "Already have an account? Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
