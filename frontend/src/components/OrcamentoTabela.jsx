import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Trash2, Plus, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';

const COLUNAS = [
  { key: 'num',           label: 'Nº',                  width: 50  },
  { key: 'etapa',         label: 'Etapa do Projeto',     width: 130 },
  { key: 'descricao',     label: 'Descrição',            width: 160 },
  { key: 'justificativa', label: 'Justif. Item',         width: 150 },
  { key: 'just_valor',    label: 'Justif. Valor',        width: 150 },
  { key: 'provimento',    label: 'Provimento',           width: 110 },
  { key: 'tipo_despesa',  label: 'Tipo de Despesa',      width: 120 },
  { key: 'unidade',       label: 'Unidade',              width: 80  },
  { key: 'quantidade',    label: 'Qtd',                  width: 60  },
  { key: 'valor_unit',    label: 'Vlr Unit.',            width: 90  },
  { key: 'valor_total',   label: 'Vlr Total',            width: 90  },
  { key: 'origem',        label: 'Origem dos Recursos',  width: 140 },
];

// Posição fixa das colunas conforme planilha padrão
// Nº | Etapa | Descrição | Justif.Item | Justif.Valor | (vazia) | Provimento | Tipo | Unidade | Qtd | Vlr Unit | Vlr Total | Origem
const POSICAO_FIXA = {
  num: 0, etapa: 1, descricao: 2, justificativa: 3, just_valor: 4,
  provimento: 6, tipo_despesa: 7, unidade: 8, quantidade: 9,
  valor_unit: 10, valor_total: 11, origem: 12
};

const linhaVazia = () => ({
  num: '', etapa: '', descricao: '', justificativa: '', just_valor: '',
  provimento: '', tipo_despesa: '', unidade: '', quantidade: '',
  valor_unit: '', valor_total: '', origem: ''
});

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsearValor(v) {
  if (v === undefined || v === null || v === '') return 0;
  let s = String(v).replace(/R\$\s*/g, '').trim();
  // Formato BR: 12.000,00
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  return parseFloat(s) || 0;
}

function formatarMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Tenta mapear colunas pelo nome, com fallback para posição fixa
function mapearColunas(headers) {
  const REGRAS = [
    { key: 'just_valor',    termos: ['justificativa para o valor', 'justificativa do valor'] },
    { key: 'justificativa', termos: ['justificativa para o item', 'justificativa do item', 'justificativa'] },
    { key: 'num',           termos: ['nº', 'n°', 'numero', 'num', 'item'] },
    { key: 'etapa',         termos: ['etapa'] },
    { key: 'descricao',     termos: ['descri'] },
    { key: 'provimento',    termos: ['provimento'] },
    { key: 'tipo_despesa',  termos: ['tipo'] },
    { key: 'unidade',       termos: ['unidade'] },
    { key: 'quantidade',    termos: ['quantidade', 'qtd'] },
    { key: 'valor_unit',    termos: ['unitario', 'unit'] },
    { key: 'valor_total',   termos: ['valor total', 'vlr total'] },
    { key: 'origem',        termos: ['origem'] },
  ];

  const mapa = {};
  const usados = new Set();

  for (const regra of REGRAS) {
    for (let i = 0; i < headers.length; i++) {
      if (usados.has(i) || mapa[regra.key] !== undefined) continue;
      const h = norm(headers[i]);
      if (!h) continue;
      if (regra.termos.some(t => h.includes(norm(t)))) {
        mapa[regra.key] = i;
        usados.add(i);
      }
    }
  }

  // Se mapeou menos de 5 colunas, usa posição fixa
  if (Object.keys(mapa).length < 5) {
    return { ...POSICAO_FIXA };
  }

  return mapa;
}

export default function OrcamentoTabela({ itens = [], onChange }) {
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [colsMapeadas, setColsMapeadas] = useState(null);
  const inputRef = useRef();

  function atualizar(i, campo, valor) {
    const novos = [...itens];
    novos[i] = { ...novos[i], [campo]: valor };
    if (campo === 'quantidade' || campo === 'valor_unit') {
      const q = parsearValor(campo === 'quantidade' ? valor : novos[i].quantidade);
      const u = parsearValor(campo === 'valor_unit' ? valor : novos[i].valor_unit);
      if (q && u) novos[i].valor_total = (q * u).toFixed(2);
    }
    onChange(novos);
  }

  function addLinha() { onChange([...itens, { ...linhaVazia(), num: itens.length + 1 }]); }
  function remLinha(i) { onChange(itens.filter((_, idx) => idx !== i)); }

  function exportarXLSX() {
    const cabecalho = [
      'Nº', 'Etapa do Projeto', 'Descrição',
      'Justificativa para o item solicitado', 'Justificativa para o valor solicitado',
      '', 'Provimento', 'Tipo de Despesa', 'Unidade de Medida',
      'Quantidade', 'Valor Unitário', 'Valor Total',
      'Origem dos Recursos que irão custear o projeto'
    ];
    const linhas = itens.map(item => [
      item.num, item.etapa, item.descricao,
      item.justificativa, item.just_valor,
      '', item.provimento, item.tipo_despesa, item.unidade,
      item.quantidade,
      parsearValor(item.valor_unit),
      parsearValor(item.valor_total),
      item.origem
    ]);
    // Linha de total
    linhas.push([
      '', '', '', '', '', '', '', '', '', '',
      'TOTAL GERAL',
      itens.reduce((acc, item) => acc + parsearValor(item.valor_total), 0),
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);

    // Larguras das colunas
    ws['!cols'] = [
      { wch: 5 }, { wch: 18 }, { wch: 30 }, { wch: 40 }, { wch: 40 },
      { wch: 3 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orçamento');
    XLSX.writeFile(wb, 'planilha-orcamentaria.xlsx');
  }

  function importarArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErro(''); setSucesso(''); setColsMapeadas(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

        if (!rows.length) { setErro('Arquivo vazio'); return; }

        // Encontra linha de cabeçalho: primeira com 3+ células não vazias
        let headerIdx = -1;
        for (let r = 0; r < Math.min(rows.length, 15); r++) {
          if (rows[r].filter(c => String(c || '').trim() !== '').length >= 3) {
            headerIdx = r; break;
          }
        }
        if (headerIdx === -1) { setErro('Cabeçalho não encontrado'); return; }

        const headers = rows[headerIdx];
        const mapa = mapearColunas(headers);

        // Mostra colunas detectadas
        setColsMapeadas(
          Object.entries(mapa).map(([key, idx]) => {
            const col = COLUNAS.find(c => c.key === key);
            return `${col?.label || key} (col ${idx + 1})`;
          })
        );

        const novosItens = [];
        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          const preenchidas = row.filter(c => String(c || '').trim() !== '');
          if (preenchidas.length === 0) continue;
          // Pula linha de total
          if (norm(String(row[0] || '')).startsWith('total')) continue;

          const item = linhaVazia();
          for (const [key, colIdx] of Object.entries(mapa)) {
            item[key] = String(row[colIdx] ?? '').trim();
          }

          // Calcula valor_total
          const q = parsearValor(item.quantidade);
          const u = parsearValor(item.valor_unit);
          const vt = parsearValor(item.valor_total);
          if (vt) item.valor_total = vt.toFixed(2);
          else if (q && u) item.valor_total = (q * u).toFixed(2);

          if (preenchidas.length >= 2) novosItens.push(item);
        }

        if (!novosItens.length) { setErro('Nenhum dado encontrado após o cabeçalho'); return; }

        onChange(novosItens);
        setSucesso(`${novosItens.length} item(ns) importado(s) com sucesso!`);
        e.target.value = '';
      } catch (err) {
        setErro('Erro ao ler arquivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const totalGeral = itens.reduce((acc, item) => acc + parsearValor(item.valor_total), 0);

  const inpCell = {
    width: '100%', padding: '5px 7px', border: '1px solid #e5e7eb', borderRadius: 4,
    fontSize: 12, outline: 'none', background: 'white', boxSizing: 'border-box'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileSpreadsheet size={16} color="#0369a1" />
          Planilha Orçamentária
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#0369a1', color: 'white', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            <Upload size={13} /> Importar XLS / XLSX / CSV
            <input ref={inputRef} type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }} onChange={importarArquivo} />
          </label>
          <button onClick={addLinha} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            <Plus size={13} /> Linha Manual
          </button>
          {itens.length > 0 && (
            <button onClick={exportarXLSX} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Download size={13} /> Baixar XLSX
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 10, fontSize: 12, color: '#991b1b' }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      {sucesso && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
            <CheckCircle2 size={14} /> {sucesso}
          </div>
          {colsMapeadas?.length > 0 && (
            <div style={{ fontSize: 11, color: '#555' }}>
              <strong>Colunas detectadas:</strong> {colsMapeadas.join(' · ')}
            </div>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '2px solid #e5e7eb', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr style={{ background: '#1a1a2e' }}>
              {COLUNAS.map(c => (
                <th key={c.key} style={{ padding: '8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', minWidth: c.width }}>
                  {c.label}
                </th>
              ))}
              <th style={{ width: 32, background: '#1a1a2e' }} />
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length + 1} style={{ padding: '28px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                  Importe uma planilha XLS/XLSX/CSV ou clique em "Linha Manual".
                </td>
              </tr>
            )}
            {itens.map((item, i) => (
              <tr key={i} style={{ background: item.provimento === 'Proponente' ? '#fefce8' : i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '3px 5px' }}><input style={{ ...inpCell, width: 38 }} value={item.num} onChange={e => atualizar(i, 'num', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}>
                  <select style={inpCell} value={item.etapa} onChange={e => atualizar(i, 'etapa', e.target.value)}>
                    <option value="">—</option>
                    <option>Pré Produção</option>
                    <option>Produção</option>
                    <option>Pós Produção</option>
                  </select>
                </td>
                <td style={{ padding: '3px 5px' }}><input style={inpCell} value={item.descricao} onChange={e => atualizar(i, 'descricao', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}><input style={inpCell} value={item.justificativa} onChange={e => atualizar(i, 'justificativa', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}><input style={inpCell} value={item.just_valor} onChange={e => atualizar(i, 'just_valor', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}>
                  <select style={{ ...inpCell, background: item.provimento === 'Proponente' ? '#fef08a' : 'white' }} value={item.provimento} onChange={e => atualizar(i, 'provimento', e.target.value)}>
                    <option value="">—</option>
                    <option>Terceiros</option>
                    <option>Proponente</option>
                  </select>
                </td>
                <td style={{ padding: '3px 5px' }}>
                  <select style={inpCell} value={item.tipo_despesa} onChange={e => atualizar(i, 'tipo_despesa', e.target.value)}>
                    <option value="">—</option>
                    <option>Despesa Administrativa</option>
                    <option>Divulgação</option>
                    <option>Elaboração</option>
                    <option>Outros</option>
                  </select>
                </td>
                <td style={{ padding: '3px 5px' }}><input style={{ ...inpCell, width: 70 }} value={item.unidade} onChange={e => atualizar(i, 'unidade', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}><input style={{ ...inpCell, width: 52 }} type="number" value={item.quantidade} onChange={e => atualizar(i, 'quantidade', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}><input style={{ ...inpCell, width: 82 }} type="number" step="0.01" value={item.valor_unit} onChange={e => atualizar(i, 'valor_unit', e.target.value)} /></td>
                <td style={{ padding: '3px 5px' }}>
                  <input style={{ ...inpCell, width: 82, fontWeight: 700, color: '#065f46', background: '#f0fdf4' }} type="number" step="0.01" value={item.valor_total} onChange={e => atualizar(i, 'valor_total', e.target.value)} />
                </td>
                <td style={{ padding: '3px 5px' }}><input style={inpCell} value={item.origem} onChange={e => atualizar(i, 'origem', e.target.value)} /></td>
                <td style={{ padding: '3px 5px', textAlign: 'center' }}>
                  <button onClick={() => remLinha(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
          {itens.length > 0 && (
            <tfoot>
              <tr style={{ background: '#1a1a2e' }}>
                <td colSpan={10} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Geral do Projeto
                </td>
                <td style={{ padding: '10px 8px', fontSize: 15, fontWeight: 900, color: '#10b981', whiteSpace: 'nowrap' }}>
                  {formatarMoeda(totalGeral)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {itens.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 10, padding: '12px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total do Projeto</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#065f46', marginTop: 2 }}>{formatarMoeda(totalGeral)}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{itens.length} item(ns)</div>
          </div>
        </div>
      )}
    </div>
  );
}
