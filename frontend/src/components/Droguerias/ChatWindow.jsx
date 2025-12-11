import React, { useContext, useRef, useEffect } from "react";
import { DrogueriaContext } from "../../context/DrogueriaContext";
import MessageItem from "./MessageItem";
import InputMessage from "./InputMessage";

export default function ChatWindow() {
  const ctx = useContext(DrogueriaContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!ctx) {
      console.error("DrogueriaContext is null in ChatWindow!");
    } else {
      console.log("ChatWindow mounted with context:", {
        drogueriaActiva: ctx.drogueriaActiva?.nombre,
        conversacionActiva: ctx.conversacionActiva?.id,
        mensajes: ctx.mensajes?.length
      });
    }
  }, [ctx]);

  if (!ctx) {
    return <div className="chat-window empty"><p>Error: Context not available</p></div>;
  }

  const { drogueriaActiva, conversacionActiva, mensajes } = ctx;

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  if (!drogueriaActiva) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <p>Selecciona una droguería para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <h2>{drogueriaActiva.nombre}</h2>
          <p>{drogueriaActiva.telefono || "Sin teléfono"}</p>
        </div>
      </div>

      <div className="messages-container">
        {(!mensajes || mensajes.length === 0) ? (
          <div className="empty-messages">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          mensajes.map((mensaje) => (
            <MessageItem key={mensaje.id} mensaje={mensaje} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputMessage conversacionId={conversacionActiva?.id} />
    </div>
  );
}
