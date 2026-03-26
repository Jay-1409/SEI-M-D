"use client";

import styles from "./ShutdownModal.module.css";

type ShutdownModalProps = {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ShutdownModal({
  open,
  submitting,
  onCancel,
  onConfirm,
}: ShutdownModalProps) {
  return (
    <div className={styles.componentScope}>
      <div
        className={`shutdown-overlay${open ? " active" : ""}`}
        id="shutdownOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      >
        <div className="shutdown-modal">
          <div className="modal-icon">⚠️</div>
          <h3>Shutdown All Services?</h3>
          <p>
            This will gracefully stop all deployed microservices and shut down
            the platform. You&apos;ll need to restart manually.
          </p>
          <div className="modal-actions">
            <button
              className="btn-cancel"
              id="shutdownCancel"
              onClick={onCancel}
              type="button"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn-shutdown"
              id="shutdownConfirm"
              onClick={onConfirm}
              type="button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div
                    className="spinner"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderWidth: "2px",
                      borderTopColor: "white",
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginRight: "6px",
                    }}
                  />
                  {" "}
                  Stopping...
                </>
              ) : (
                "Shutdown"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
