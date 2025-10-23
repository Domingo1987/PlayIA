import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

const CardDeckSimulation = () => {
  const [cards, setCards] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Inicializar el mazo
  useEffect(() => {
    initializeDeck();
  }, []);

  const initializeDeck = () => {
    const newDeck = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      number: i + 1
    }));
    setCards(newDeck);
    setDrawnCards([]);
    setCurrentCard(null);
    setSelectedCard(null);
  };

  const startSimulation = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setDrawnCards([]);
    setSelectedCard(null);
    
    const deckCopy = [...cards];
    const drawn = [];

    for (let i = 0; i < 10; i++) {
      if (deckCopy.length === 0) break;
      
      // Sacar carta del mazo
      const card = deckCopy.shift();
      setCurrentCard(card);
      
      // Esperar 100ms para la animación de girar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Agregar a las cartas sacadas
      drawn.push(card);
      setDrawnCards([...drawn]);
      setCurrentCard(null);
      
      // Pequeña pausa antes de la siguiente carta
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // La última carta es la elegida
    if (drawn.length > 0) {
      setSelectedCard(drawn[drawn.length - 1]);
    }
    
    setCards(deckCopy);
    setIsAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Simulación de Mazo de Cartas
        </h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={startSimulation}
            disabled={isAnimating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {isAnimating ? 'Animando...' : 'Iniciar Simulación'}
          </button>
          
          <button
            onClick={initializeDeck}
            disabled={isAnimating}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Reiniciar
          </button>
        </div>

        <div className="flex justify-center items-start gap-16">
          {/* Mazo de cartas */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Mazo ({cards.length} cartas)
            </h2>
            <div className="relative w-32 h-44">
              {cards.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className="absolute w-full h-full bg-red-700 rounded-lg border-4 border-white shadow-lg"
                  style={{
                    top: `${index * 2}px`,
                    left: `${index * 2}px`,
                    zIndex: 5 - index
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-16 bg-white rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carta siendo sacada */}
          {currentCard && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold text-white mb-4">
                Sacando carta...
              </h2>
              <div 
                className="w-32 h-44 bg-white rounded-lg border-4 border-yellow-400 shadow-2xl flex items-center justify-center animate-spin"
                style={{ animationDuration: '0.3s', animationIterationCount: '1' }}
              >
                <span className="text-6xl font-bold text-gray-800">
                  {currentCard.number}
                </span>
              </div>
            </div>
          )}

          {/* Cartas sacadas */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Cartas Sacadas ({drawnCards.length}/10)
            </h2>
            <div className="relative w-32 h-44">
              {drawnCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`absolute w-full h-full rounded-lg border-4 shadow-lg transition-all duration-200 ${
                    selectedCard && card.id === selectedCard.id
                      ? 'bg-yellow-400 border-yellow-600 scale-110 z-50'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{
                    top: `${index * 3}px`,
                    left: `${index * 2}px`,
                    zIndex: index,
                    transform: selectedCard && card.id === selectedCard.id ? 'scale(1.1) translateY(-10px)' : ''
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-5xl font-bold ${
                      selectedCard && card.id === selectedCard.id ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {card.number}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedCard && (
          <div className="mt-12 text-center">
            <div className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg inline-block shadow-2xl">
              <p className="text-2xl font-bold">
                ¡Carta Elegida: {selectedCard.number}!
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-white text-sm opacity-75">
          <p>Cada carta se extrae en 100ms, gira mostrando su número y se apila a la derecha.</p>
          <p>Después de 10 iteraciones, la última carta extraída es la elegida.</p>
        </div>
      </div>
    </div>
  );
};

export default CardDeckSimulation;