import styles from "./ShutdownScreen.module.css";

type ShutdownScreenProps = {
  active: boolean;
  completed: boolean;
};

export default function ShutdownScreen({
  active,
  completed,
}: ShutdownScreenProps) {
  return (
    <div className={styles.componentScope}>
      <div className={`shutdown-screen${active ? " active" : ""}`} id="shutdownScreen">
        <div
          className="shutdown-icon"
          style={completed ? { animation: "none" } : undefined}
        >
          {completed ? "✅" : "🔌"}
        </div>
        <h2>{completed ? "Platform Stopped" : "Shutting Down..."}</h2>
        <p>
          {completed
            ? "All microservices have been gracefully shut down."
            : "Gracefully stopping all microservices."}
        </p>
        <div
          className="spinner"
          style={{
            borderTopColor: "var(--accent)",
            borderColor: "var(--border)",
            display: completed ? "none" : "block",
          }}
        />
      </div>
    </div>
  );
}
