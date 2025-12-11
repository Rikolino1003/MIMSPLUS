import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function MessageItem({ mensaje }) {
  const esUsuario = mensaje.remitente_tipo === "usuario";

  return (
    <div className={`message-item ${esUsuario ? "usuario" : "drogueria"}`}>
      <div className="message-bubble">
        <p className="message-text">{mensaje.texto}</p>
        <span className="message-time">
          {formatDistanceToNow(new Date(mensaje.creado), { addSuffix: true, locale: es })}
        </span>
      </div>
    </div>
  );
}
