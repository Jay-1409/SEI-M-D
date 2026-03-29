import { useStore } from '../state/store';
import { COMPONENT_INFO } from '../state/presets';

export default function InfoPanel() {
  const key = useStore(s => s.ui.infoPanelKey);
  const setUI = useStore(s => s.setUI);

  if (!key) return null;
  const info = COMPONENT_INFO[key];
  if (!info) { setUI({ infoPanelKey: null }); return null; }

  const close = () => setUI({ infoPanelKey: null });

  return (
    <>
      <div className="modal-overlay" onClick={close} />
      <div className="info-modal">
        <button className="im-close" onClick={close}>×</button>
        <h3 className="im-title">{info.title}</h3>
        <div className="im-block">
          <div className="im-label">What it does</div>
          <p>{info.what}</p>
        </div>
        <div className="im-block">
          <div className="im-label">Why it exists</div>
          <p>{info.why}</p>
        </div>
        <div className="im-warn">
          <span>⚠️</span>
          <div>
            <strong>If disabled or removed:</strong>
            <p>{info.impact}</p>
          </div>
        </div>
      </div>
    </>
  );
}
