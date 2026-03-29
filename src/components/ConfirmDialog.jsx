export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000,
    }}>
      <div style={{
        background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 14,
        padding: "32px 28px", width: 320, textAlign: "center",
      }}>
        <div style={{ fontSize: 17, color: "#e8e8e8", marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={{
            padding: "10px 24px", borderRadius: 8, fontSize: 15,
            background: "none", border: "0.5px solid #2a2a2a", color: "#888", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "10px 24px", borderRadius: 8, fontSize: 15,
            background: "#c0392b", border: "none", color: "#fff", cursor: "pointer",
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}