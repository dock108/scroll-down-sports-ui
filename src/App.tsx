import { Navigate, Route, Routes } from 'react-router-dom';
import DatePicker from './pages/DatePicker';
import GameList from './pages/GameList';
import GameReplay from './pages/GameReplay';

const App = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<DatePicker />} />
        <Route path="/games" element={<GameList />} />
        <Route path="/game/:gameId" element={<GameReplay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
