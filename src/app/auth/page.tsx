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
      setError("Пароли не совпадают");
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
          setError("Сервер не вернул токен авторизации");
        } else {
          setIsLogin(true);
          setError("Регистрация успешна! Теперь вы можете войти.");
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
          setError("Неверный email или пароль");
        } else if (err.response.status === 409) {
          setError(err.response.data?.message || "Пользователь уже существует");
        } else {
          const errorMessage =
            err.response.data?.message ||
            err.response.data?.error ||
            "Произошла ошибка при авторизации";
          setError(errorMessage);
        }
      } else if (err.request) {
        setError("Сервер недоступен. Пожалуйста, проверьте подключение");
      } else {
        setError("Произошла ошибка при отправке запроса");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{isLogin ? "Вход" : "Регистрация"}</h1>
        </div>

        {error && <div className="notification error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Введите имя пользователя"
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
              placeholder="Введите ваш email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Введите пароль"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Повторите пароль"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? "Загрузка..."
                : isLogin
                ? "Войти"
                : "Зарегистрироваться"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="secondary-button"
              disabled={loading}
            >
              {isLogin ? "Создать аккаунт" : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
