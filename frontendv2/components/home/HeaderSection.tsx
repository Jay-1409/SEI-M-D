import styles from "./HeaderSection.module.css";

export default function HeaderSection() {
  return (
    <div className={styles.componentScope}>
      <header>
        <div className="logo-container">
          <div className="logo-glow" />
          <div className="logo-icon">🚀</div>
        </div>
        <h1>Secure Microservice Deployer</h1>
        <p>
          Orchestrate your containers with enterprise-grade security and
          reliability.
        </p>
      </header>
    </div>
  );
}
