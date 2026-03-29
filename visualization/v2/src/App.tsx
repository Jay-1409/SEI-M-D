import './styles/theme.css';
import Controls from './components/Controls';
import ConfigPanel from './components/ConfigPanel';
import Canvas from './components/Canvas';
import Timeline from './components/Timeline';
import InfoPanel from './components/InfoPanel';

export default function App() {
  return (
    <>
      <Controls />
      <div className="app-body">
        <ConfigPanel />
        <Canvas />
        <Timeline />
      </div>
      <InfoPanel />
    </>
  );
}
