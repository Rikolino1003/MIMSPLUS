import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import { loginUsuario } from '../services/api'

export default function Workspace(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ username: '', password: '', email: '' })
  const [msg, setMsg] = useState(null)

  const doLogin = async () => {
    try {
      await loginUsuario({ username: form.username, password: form.password }, true)
      // ahora persistir la droguería activa
      await API.post('droguerias/set_active/', { drogueria: id })
      setMsg({ type: 'success', text: 'Sesión iniciada y droguería abierta.' })
      navigate('/paneladmin')
    } catch (e) {
      console.error(e)
      setMsg({ type: 'error', text: e.message || 'Error al iniciar sesión' })
    }
  }

  const doRegister = async () => {
    try {
      const payload = { username: form.username, password: form.password, email: form.email }
      await API.post('usuarios/registro/', payload)
      await doLogin()
    } catch (e) {
      console.error(e)
      setMsg({ type: 'error', text: e.response?.data?.detail || e.message || 'Error al registrar' })
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Workspace — Droguería {id}</h2>
      {msg && <div className={`p-3 rounded ${msg.type==='error'?'bg-red-50 text-red-700':'bg-green-50 text-green-800'}`}>{msg.text}</div>}

      <div className="mt-4 border rounded p-4 bg-white">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('login')} className={`px-3 py-1 rounded ${mode==='login'?'bg-indigo-600 text-white':'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`px-3 py-1 rounded ${mode==='register'?'bg-indigo-600 text-white':'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>Registro</button>
        </div>

        <div>
          <label className="block text-sm">Usuario</label>
          <input className="input-default" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
          {mode==='register' && (
            <>
              <label className="block text-sm mt-2">Email</label>
              <input className="input-default" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            </>
          )}
          <label className="block text-sm mt-2">Contraseña</label>
          <input type="password" className="input-default" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => navigate('/paneladmin')} className="btn-secondary px-4 py-2">Volver</button>
            {mode==='login' ? (
              <button onClick={doLogin} className="btn-primary px-4 py-2">Iniciar sesión y abrir</button>
            ) : (
              <button onClick={doRegister} className="btn-primary px-4 py-2">Registrar y abrir</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
