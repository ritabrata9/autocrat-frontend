import { useState } from "react";

let _setToast = null;
export function Toast() {
  const [msg, setMsg] = useState(null);
  _setToast = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };
  
  if (!msg) return null;
  return <div className="toast-message">{msg}</div>;
}
export const toast = (m) => _setToast && _setToast(m);

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-text">{message}</div>
        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
          <button onClick={onConfirm} className="btn-confirm">Confirm</button>
        </div>
      </div>
    </div>
  );
}