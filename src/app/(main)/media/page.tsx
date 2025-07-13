"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import NavBar from "@/components/ui/NavBar";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import "@/styles/pages/Media.css";
import api from "@/lib/api/client";
import { deleteMedia } from "@/lib/api/mediaApi";
import { AxiosError } from "axios";

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
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    setUploading(true);
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
      for (const file of fileList) {
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
          },
        );
        if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
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
              {uploading ? "Загрузка..." : "Загрузить фото"}
            </label>
          </div>

          <div className="selection-controls">
            <button
              className={`select-mode-button ${selectMode ? "active" : ""}`}
              onClick={toggleSelectMode}
            >
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
