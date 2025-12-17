import { useEffect, useMemo, useState } from 'react'
import GIFS from './gifs'
import FUNNY_GIFS from './funny-gifs'

type State = {
  todosOsNomes: string[]
  sorteados: string[]
}

const chaves = {
  storage: 'amigo-chocolate-estado',
}

function normalizarEntrada(texto: string) {
  return texto
    .split(/\r?\n|,|;/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function App() {
  const [entradaNomes, setEntradaNomes] = useState('')
  const [estado, setEstado] = useState<State>({ todosOsNomes: [], sorteados: [] })
  const [modalAberta, setModalAberta] = useState(false)
  const [modalFinal, setModalFinal] = useState<string | null>(null)
  const [modalExibido, setModalExibido] = useState<string>('')
  const [gifVisivel, setGifVisivel] = useState(false)
  const [gifUrl, setGifUrl] = useState<string>('')
  const ALL_GIFS = useMemo(() => [...FUNNY_GIFS, ...GIFS], [])

  useEffect(() => {
    const salvo = localStorage.getItem(chaves.storage)
    if (salvo) {
      try {
        const parse = JSON.parse(salvo) as State
        setEstado({
          todosOsNomes: Array.isArray(parse.todosOsNomes) ? parse.todosOsNomes : [],
          sorteados: Array.isArray(parse.sorteados) ? parse.sorteados : [],
        })
        setEntradaNomes(parse.todosOsNomes?.join('\n') ?? '')
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(chaves.storage, JSON.stringify(estado))
  }, [estado])

  const nomesUnicos = useMemo(() => {
    const lista = normalizarEntrada(entradaNomes)
    const vistos = new Set<string>()
    const unicos: string[] = []
    for (const n of lista) {
      const chave = n.toLowerCase()
      if (!vistos.has(chave)) {
        vistos.add(chave)
        unicos.push(n)
      }
    }
    return unicos
  }, [entradaNomes])

  useEffect(() => {
    setEstado(prev => ({
      todosOsNomes: nomesUnicos,
      sorteados: prev.sorteados.filter(s => nomesUnicos.some(n => n.toLowerCase() === s.toLowerCase())),
    }))
  }, [nomesUnicos])

  const restantes = useMemo(() => {
    const s = new Set(estado.sorteados.map(n => n.toLowerCase()))
    return estado.todosOsNomes.filter(n => !s.has(n.toLowerCase()))
  }, [estado])

  const ultimoSorteado = estado.sorteados[estado.sorteados.length - 1]
  const terminou = restantes.length === 0 && estado.sorteados.length > 0

  function sortear() {
    if (restantes.length === 0) return
    const idx = Math.floor(Math.random() * restantes.length)
    const escolhido = restantes[idx]
    setEstado(prev => ({ ...prev, sorteados: [...prev.sorteados, escolhido] }))
    setModalFinal(escolhido)
    setModalAberta(true)
    setModalExibido('')
    setGifVisivel(false)
    const gidx = Math.floor(Math.random() * ALL_GIFS.length)
    setGifUrl(ALL_GIFS[gidx] ?? ALL_GIFS[0])
  }

  function resetar() {
    setEstado({ todosOsNomes: nomesUnicos, sorteados: [] })
  }

  useEffect(() => {
    if (modalAberta && modalFinal) {
      const nomes = nomesUnicos.length > 0 ? nomesUnicos : estado.todosOsNomes
      let i = 0
      const interval = setInterval(() => {
        setModalExibido(nomes[i % nomes.length] ?? '')
        i++
      }, 60)
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setModalExibido(modalFinal)
        const t2 = setTimeout(() => {
          setGifVisivel(true)
        }, 400)
        return () => clearTimeout(t2)
      }, 1200)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [modalAberta, modalFinal, nomesUnicos, estado.todosOsNomes])

  return (
    <div className="container-app">
      <div className="shell">
        <h1 className="title">Sorteio Simples</h1>

        <div className="card">
          <div className="card-body">
          <label htmlFor="nomes" className="label">Lista de nomes</label>
          <textarea
            id="nomes"
            placeholder="Digite nomes separados por linha, vírgula ou ponto e vírgula"
            value={entradaNomes}
            onChange={e => setEntradaNomes(e.target.value)}
            rows={8}
            className="textarea"
          />
          <div className="stats">
            <span>Total: {nomesUnicos.length}</span>
            <span>Sorteados: {estado.sorteados.length}</span>
            <span>Participantes: {restantes.length}</span>
          </div>
          <div className="actions">
            <button
              onClick={sortear}
              disabled={nomesUnicos.length === 0 || restantes.length === 0}
              className="btn btn-primary btn-block"
            >
              Sortear
            </button>
          </div>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <h2 className="subtitle">Sorteados</h2>
            <ul className="list list-scroll">
            {estado.sorteados.map((n, i) => (
                <li key={`${n}-${i}`} className="list-item">{n}</li>
            ))}
            </ul>
          </div>
          <div>
            <h2 className="subtitle">Concorrendo</h2>
            <ul className="list list-scroll">
            {restantes.map((n, i) => (
                <li key={`${n}-${i}`} className="list-item">{n}</li>
            ))}
            </ul>
          </div>
        </div>

        <div className="winner">
          {ultimoSorteado ? <div>Último sorteado: <strong className="font-medium">{ultimoSorteado}</strong></div> : <div>Sem sorteios ainda</div>}
          {terminou ? <div className="badge">Premiado: {ultimoSorteado}</div> : null}
        </div>

        <div className="actions">
            <button
              onClick={resetar}
              disabled={nomesUnicos.length === 0}
              className="btn btn-secondary self-end"
            >
              Resetar
            </button>
        </div>
      </div>
      {modalAberta ? (
        <div className="modal" onClick={() => { setModalAberta(false); setModalFinal(null); setModalExibido(''); setGifVisivel(false); setGifUrl('') }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              {modalExibido && modalExibido === modalFinal ? (
                <>
                  <div className="modal-name pop">{modalExibido}</div>
                  {gifVisivel ? (
                    <img
                      src={gifUrl}
                      alt="Celebração"
                      className="mx-auto mt-4 w-96 md:w-[560px] max-w-full rounded-xl"
                      onError={() => setGifUrl(ALL_GIFS[0])}
                    />
                  ) : null}
                </>
              ) : (
                <div className="reel pulse">{modalExibido || '...'}</div>
              )}
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  disabled={nomesUnicos.length === 0 || restantes.length === 0}
                  onClick={() => {
                    sortear()
                  }}
                >
                  Sortear
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
