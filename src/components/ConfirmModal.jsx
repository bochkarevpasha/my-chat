const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Подтвердить", cancelText = "Отмена" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>

                <div className="modal-actions">
                    <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                    <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;