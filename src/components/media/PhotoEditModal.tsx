import React, { useState, useEffect } from 'react';
import styles from './PhotoEditModal.module.css';

interface Photo {
  photoId: string;
  description?: string;
  description_hidden?: boolean;
  date?: string | null;
  date_hidden?: boolean;
  [key: string]: any;
}

interface PhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
  onSave: (photo: Photo) => void;
}

const PhotoEditModal: React.FC<PhotoEditModalProps> = ({ isOpen, onClose, photo, onSave }) => {
  const [description, setDescription] = useState('');
  const [descriptionHidden, setDescriptionHidden] = useState(false);
  const [date, setDate] = useState('');
  const [dateHidden, setDateHidden] = useState(false);

  useEffect(() => {
    if (photo) {
      setDescription(photo.description || '');
      setDescriptionHidden(photo.description_hidden || false);
      setDate(photo.date ? new Date(photo.date).toISOString().split('T')[0] : '');
      setDateHidden(photo.date_hidden || false);
    }
  }, [photo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) return;
    onSave({
      ...photo,
      description: description !== '' ? description : photo.description,
      description_hidden: descriptionHidden,
      date: date ? new Date(date).toISOString() : photo.date,
      date_hidden: dateHidden,
    });
  };

  if (!isOpen || !photo) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Редактировать фото</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>
              Описание:
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                rows={4}
              />
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={descriptionHidden}
                onChange={(e) => setDescriptionHidden(e.target.checked)}
              />
              Скрыть описание
            </label>
          </div>
          <div className={styles.formGroup}>
            <label>
              Дата:
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dateHidden}
                onChange={(e) => setDateHidden(e.target.checked)}
              />
              Скрыть дату
            </label>
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.saveButton}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoEditModal; 