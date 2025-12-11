import React, { useState, useContext } from "react";
import { Send } from "lucide-react";
import { DrogueriaContext } from "../../context/DrogueriaContext";

export default function InputMessage({ conversacionId }) {
  const [texto, setTexto] = useState("");
  const { enviarMensaje } = useContext(DrogueriaContext);

  const handleSend = () => {
    if (texto.trim()) {
      enviarMensaje(texto);
      setTexto("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-message">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Escribe un mensaje..."
        rows="3"
      />
      <button onClick={handleSend} disabled={!texto.trim()}>
        <Send size={20} />
      </button>
    </div>
  );
}
