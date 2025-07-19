"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import NavBar from "@/components/ui/NavBar";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import "@/styles/pages/Media.css";
import api from "@/lib/api/client";
import { deleteMedia } from "@/lib/api/mediaApi";
import { AxiosError } from "axios";
import { Upload, Check, X, Trash2 } from "lucide-react";

interface MediaFile {
  _id?: string; // id из БД, может отсутствовать сразу после загрузки
  photoId: string;
  filename: string;
  originalName: string;
  url: string;
}

const MediaPage: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    fetchUserMedia();
  }, []);

  const fetchUserMedia = async () => {
    try {
      const response = await api.get<{ media: MediaFile[] }>("/api/media");
      setFiles(response.data.media || []);
      setError(null);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 401) {
        setError("Необходима авторизация");
      } else {
        setError("Не удалось загрузить медиафайлы");
      }
      console.error("Error fetching media:", err);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Фильтруем по типу и размеру (мобилки часто дают HEIC или большие файлы)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const maxSize = 8 * 1024 * 1024; // 8MB

    const fileList = rawFiles.filter((f) => {
      if (!allowedTypes.includes(f.type) || f.size > maxSize) {
        console.warn("Пропускаем неподдерживаемый файл", f.name, f.type, f.size);
        return false;
      }
      return true;
    });

    if (fileList.length === 0) {
      setError("Выберите JPG/PNG/WebP/GIF до 8 МБ");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // 1. Получаем подпись для загрузки
      const signRes = await api.post<{
        timestamp: number;
        signature: string;
        apiKey: string;
        cloudName: string;
        folder: string | null;
      }>("/api/media/sign", { folder: "" });

      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      // 2. Загружаем файлы напрямую в Cloudinary
      const uploaded: any[] = [];
      for (let idx = 0; idx < fileList.length; idx++) {
        const file = fileList[idx];
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("api_key", apiKey);
        uploadData.append("timestamp", String(timestamp));
        uploadData.append("signature", signature);
        if (folder) uploadData.append("folder", folder);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: uploadData,
            mode: "cors",
          },
        );
        if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
        // обновляем прогресс простым подсчётом загруженных файлов
        setUploadProgress(Math.round(((idx + 1) / fileList.length) * 100));
        const json = await cloudRes.json();
        uploaded.push({
          photoId: json.public_id,
          publicId: json.public_id,
          filename: json.asset_id || json.public_id,
          originalName: json.original_filename,
          url: json.url,
          secureUrl: json.secure_url,
        });
      }

      // 3. Сохраняем метаданные на сервере
      await api.post("/api/media/save", { files: uploaded });

      await fetchUserMedia();
    } catch (err) {
      setError("Не удалось загрузить файлы");
      console.error("Error uploading files:", err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
      setUploadProgress(0);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deleteMedia(photoId);
      await fetchUserMedia();
    } catch (err) {
      setError("Не удалось удалить файл");
      console.error("Error deleting file:", err);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) setSelectedFiles([]);
  };

  const toggleFileSelection = (photoId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles((prev) =>
      prev.length === files.length ? [] : files.map((f) => f.photoId)
    );
  };

  const deleteSelectedFiles = () => {
    if (selectedFiles.length === 0) return;

    confirmAlert({
      title: "Подтверждение удаления",
      message: `Вы уверены, что хотите удалить ${selectedFiles.length} выбранных файлов? Это действие нельзя отменить.`,
      buttons: [
        {
          label: "Да, удалить",
          onClick: async () => {
            try {
              for (const id of selectedFiles) {
                await handleDelete(id);
              }
              setSelectedFiles([]);
              setSelectMode(false);
            } catch (e) {
              setError("Не удалось удалить некоторые файлы");
            }
          },
        },
        { label: "Отмена" },
      ],
    });
  };

  if (typeof window !== "undefined" && !localStorage.getItem("userToken")) {
    return (
      <div>
        <NavBar />
        <div className="media-container">
          <div className="error-message">Для доступа к медиа библиотеке необходимо авторизоваться</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="media-container">
        <h2>Медиа библиотека</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="controls-section">
          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              id="file-upload"
              className="file-input"
              multiple
            />
            <label htmlFor="file-upload" className="upload-button">
              <Upload size={18} />
              {uploading ? `Загрузка ${uploadProgress}%` : "Загрузить фото"}
            </label>
            {uploading && (
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          <div className="selection-controls">
            <button
              className={`select-mode-button ${selectMode ? "active" : ""}`}
              onClick={toggleSelectMode}
            >
              {selectMode ? <X size={18} /> : <Check size={18} />}
              {selectMode ? "Отменить выбор" : "Выбрать файлы"}
            </button>

            {selectMode && (
              <>
                <button className="select-all-button" onClick={selectAllFiles}>
                  {selectedFiles.length === files.length ? "Снять выбор" : "Выбрать все"}
                </button>
                <button
                  className="delete-selected-button"
                  onClick={deleteSelectedFiles}
                  disabled={selectedFiles.length === 0}
                >
                  <Trash2 size={18} />
                  Удалить выбранные ({selectedFiles.length})
                </button>
              </>
            )}
          </div>
        </div>

        <div className="media-grid">
          {files.map((file) => (
            <div
              key={file.photoId}
              className={`media-item ${selectMode ? "selectable" : ""} ${selectedFiles.includes(file.photoId) ? "selected" : ""}`}
              onClick={() => selectMode && toggleFileSelection(file.photoId)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt={file.filename} />
              {!selectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.photoId);
                  }}
                  className="delete-button"
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
          {files.length === 0 && !error && (
            <div className="no-files-message">Нет загруженных файлов</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPage;
