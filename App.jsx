// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [admin, setAdmin] = useState(false);
  const [form, setForm] = useState({ categoria: '', nome: '', endereco: '', horario: '', nota: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [mapUrl, setMapUrl] = useState('');
  const [flow, setFlow] = useState([]);

  useEffect(() => {
    if (form.endereco) {
      setMapUrl(`https://www.google.com/maps/embed/v1/place?key=SUA_CHAVE_GOOGLE&q=${encodeURIComponent(form.endereco)}`);
    } else {
      setMapUrl('');
    }
  }, [form.endereco]);

  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, { email, senha });
      const token = res.data.token;
      setToken(token);
      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdmin(payload.admin);
    } catch (err) {
      alert('Erro no login');
    }
  };

  const adicionarLocal = async () => {
    try {
      await axios.post(`${API}/places`, { ...form, nota: parseFloat(form.nota) }, { headers: { Authorization: token } });
      alert('Local cadastrado');
    } catch (err) {
      alert('Erro ao cadastrar local');
    }
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const carregarFlow = async () => {
    try {
      const res = await axios.get(`${API}/flow`, { headers: { Authorization: token } });
      setFlow(res.data);
    } catch (err) {
      alert('Erro ao carregar flow');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      {!token ? (
        <div>
          <h2>Login</h2>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button onClick={login}>Entrar</button>
        </div>
      ) : (
        <div>
          <button onClick={() => { localStorage.removeItem('token'); setToken(''); }}>Sair</button>
          <button onClick={carregarFlow}>Ver Flow</button>
          {flow.length > 0 && (
            <div>
              <h3>Sugestões</h3>
              {flow.map((f) => <div key={f._id}>{f.nome} - {f.categoria}</div>)}
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <h3>Cadastro de Local {admin ? '(admin)' : ''}</h3>
            <input name="categoria" placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <input name="nome" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input name="endereco" placeholder="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            <input name="horario" placeholder="Horário" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
            <input name="nota" placeholder="Nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            <input type="file" onChange={handleFile} />
            {imagePreview && <img src={imagePreview} alt="preview" style={{ maxWidth: 200, display: 'block', marginTop: 8 }} />}
            <button onClick={adicionarLocal}>Salvar Local</button>
            {mapUrl && <iframe title="map" src={mapUrl} style={{ width: '100%', height: 300, marginTop: 12 }} />}
          </div>
        </div>
      )}
    </div>
  );
}
