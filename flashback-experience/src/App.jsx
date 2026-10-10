import { useEffect, useState } from 'react';
import Grain from './components/Grain.jsx';
import PasswordScreen from './components/PasswordScreen.jsx';
import FlashbackExperience from './components/FlashbackExperience.jsx';

// 'checking' -> asks the server if a valid login cookie already exists
// 'locked'   -> Page 1 (password)
// 'unlocked' -> Page 2 (experience)
export default function App() {
  const [stage, setStage] = useState('checking');

  useEffect(() => {
    fetch('/api/session')
      .then((r) => r.json())
      .then((d) => setStage(d.ok ? 'unlocked' : 'locked'))
      .catch(() => setStage('locked'));
  }, []);

  return (
    <>
      {stage === 'locked' && <PasswordScreen onSuccess={() => setStage('unlocked')} />}
      {stage === 'unlocked' && <FlashbackExperience />}
      <Grain />
    </>
  );
}
