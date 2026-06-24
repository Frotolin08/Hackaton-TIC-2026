import React, { createContext, useState, useContext } from 'react';

// Context that holds the current generated game set and the selected mode.
const GameContext = createContext({
  activeSet: null,
  setActiveSet: () => {},
  gameMode: null,
  setGameMode: () => {}
});

export const GameProvider = ({ children }) => {
  const [activeSet, setActiveSet] = useState(null);
  const [gameMode, setGameMode] = useState(null);

  return (
    <GameContext.Provider value={{ activeSet, setActiveSet, gameMode, setGameMode }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
