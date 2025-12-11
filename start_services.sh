#!/bin/bash
# Script para iniciar MIMS en dos terminales

# Terminal 1: Backend
cd /c/Rikolino/m/MIMS--main
echo "Iniciando Django backend en puerto 8000..."
python manage.py runserver

# Terminal 2: Frontend
cd /c/Rikolino/m/MIMS--main/frontend
echo "Iniciando Vite en puerto 5173..."
npm run dev
