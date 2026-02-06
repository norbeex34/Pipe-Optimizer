'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Scissors, TrendingDown, AlertCircle, Printer } from 'lucide-react';

export default function PipeCuttingOptimizer() {
  const [stockLength, setStockLength] = useState(6000);
  const [cuts, setCuts] = useState<Array<{id: number, length: number, quantity: number}>>([]);
  const [newCutLength, setNewCutLength] = useState('');
  const [newCutQuantity, setNewCutQuantity] = useState(1);
  const [optimization, setOptimization] = useState<any>(null);
  const [animateResults, setAnimateResults] = useState(false);
  const [kerfEnabled, setKerfEnabled] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(3);

  const addCut = () => {
    if (newCutLength && parseFloat(newCutLength) > 0) {
      setCuts([...cuts, { 
        id: Date.now(), 
        length: parseFloat(newCutLength), 
        quantity: parseInt(newCutQuantity.toString()) || 1 
      }]);
      setNewCutLength('');
      setNewCutQuantity(1);
    }
  };

  const removeCut = (id: number) => {
    setCuts(cuts.filter(cut => cut.id !== id));
  };

  const optimizeCuts = () => {
    if (cuts.length === 0) return;

    // Expandir cortes según cantidad
    const expandedCuts: number[] = [];
    cuts.forEach(cut => {
      for (let i = 0; i < cut.quantity; i++) {
        expandedCuts.push(cut.length);
      }
    });

    // Ordenar de mayor a menor (First Fit Decreasing)
    expandedCuts.sort((a, b) => b - a);

    const pipes: Array<{cuts: number[]}> = [];
    const kerf = kerfEnabled ? kerfWidth : 0;

    expandedCuts.forEach(cutLength => {
      let placed = false;
      
      for (let pipe of pipes) {
        const usedLength = pipe.cuts.reduce((sum, cut) => sum + cut + kerf, 0) - kerf;
        if (usedLength + kerf + cutLength <= stockLength) {
          pipe.cuts.push(cutLength);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        pipes.push({ cuts: [cutLength] });
      }
    });

    const totalWaste = pipes.reduce((sum, pipe) => {
      const used = pipe.cuts.reduce((s, c) => s + c + kerf, 0) - kerf;
      return sum + (stockLength - used);
    }, 0);

    const totalCutLength = expandedCuts.reduce((sum, cut) => sum + cut, 0);
    const efficiency = ((totalCutLength / (pipes.length * stockLength)) * 100).toFixed(1);

    setOptimization({
      pipes,
      totalPipes: pipes.length,
      totalWaste,
      efficiency,
      totalCutLength,
      kerf
    });

    setAnimateResults(true);
    setTimeout(() => setAnimateResults(false), 50);
  };

  useEffect(() => {
    if (cuts.length > 0) {
      optimizeCuts();
    } else {
      setOptimization(null);
    }
  }, [cuts, stockLength, kerfEnabled, kerfWidth]);

  const totalCutsCount = cuts.reduce((sum, cut) => sum + cut.quantity, 0);

  // Función para agrupar caños idénticos
  const groupIdenticalPipes = (pipes: Array<{cuts: number[]}>) => {
    const grouped: Array<{cuts: number[], count: number}> = [];
    
    pipes.forEach(pipe => {
      const pipeSignature = pipe.cuts.slice().sort((a, b) => a - b).join(',');
      const existing = grouped.find(g => 
        g.cuts.slice().sort((a, b) => a - b).join(',') === pipeSignature
      );
      
      if (existing) {
        existing.count++;
      } else {
        grouped.push({ cuts: pipe.cuts, count: 1 });
      }
    });
    
    return grouped;
  };

  const exportToPrint = () => {
    if (!optimization) return;

    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const groupedPipes = groupIdenticalPipes(optimization.pipes);

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plan de Corte - MSH Tube Optimizer</title>
  <style>
    @page { margin: 2cm; size: A4; }
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1e293b; max-width: 100%; margin: 0; padding: 20px; }
    .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #0ea5e9; font-size: 32px; font-weight: bold; }
    .header .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
    .header .date { color: #94a3b8; font-size: 12px; margin-top: 10px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-box { background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 4px; }
    .stat-box.waste { border-left-color: #ef4444; }
    .stat-box.efficiency { border-left-color: #10b981; }
    .stat-box label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; letter-spacing: 0.5px; }
    .stat-box value { display: block; font-size: 24px; font-weight: bold; color: #0f172a; }
    .config-section { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
    .config-section h3 { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .config-section p { margin: 5px 0; color: #78350f; font-size: 13px; }
    .cuts-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .cuts-list h2 { margin: 0 0 15px 0; color: #0f172a; font-size: 18px; }
    .cut-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .cut-item { background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; font-size: 13px; }
    .cut-item strong { color: #0ea5e9; font-size: 16px; }
    .pipes-section h2 { color: #0f172a; font-size: 20px; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .pipe-card { background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
    .pipe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
    .pipe-number { font-size: 18px; font-weight: bold; color: #0ea5e9; }
    .pipe-stats { font-size: 12px; color: #64748b; }
    .pipe-visual { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 4px; height: 60px; display: flex; margin-bottom: 15px; overflow: hidden; }
    .cut-segment { background: linear-gradient(to bottom, #0ea5e9, #0284c7); border-right: 3px solid #1e293b; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; position: relative; }
    .waste-segment { background: repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px); display: flex; align-items: center; justify-content: center; color: #991b1b; font-weight: bold; font-size: 11px; border-left: 2px dashed #ef4444; }
    .cuts-detail { display: flex; flex-wrap: wrap; gap: 8px; }
    .cut-tag { background: #dbeafe; border: 1px solid #0ea5e9; color: #0c4a6e; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
    .notes { background: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; margin-top: 30px; border-radius: 4px; }
    .notes h3 { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .notes ul { margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; }
    .notes li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PLAN DE CORTE DE CAÑOS</h1>
    <div class="subtitle">Plan de optimización generado por MSH Tube Optimizer</div>
    <div class="date">Generado el: ${date}</div>
  </div>

  <div class="summary">
    <div class="stat-box">
      <label>Total Caños</label>
      <value>${optimization.totalPipes}</value>
    </div>
    <div class="stat-box efficiency">
      <label>Eficiencia</label>
      <value>${optimization.efficiency}%</value>
    </div>
    <div class="stat-box waste">
      <label>Desperdicio Total</label>
      <value>${optimization.totalWaste}mm</value>
    </div>
    <div class="stat-box">
      <label>Total a Cortar</label>
      <value>${optimization.totalCutLength}mm</value>
    </div>
  </div>

  <div class="config-section">
    <h3>⚙️ CONFIGURACIÓN</h3>
    <p><strong>Longitud del caño stock:</strong> ${stockLength} mm</p>
    <p><strong>Kerf (ancho de corte):</strong> ${kerfEnabled ? kerfWidth + ' mm' : 'Deshabilitado'}</p>
    <p><strong>Total de piezas a cortar:</strong> ${totalCutsCount} unidades</p>
  </div>

  <div class="cuts-list">
    <h2>📋 LISTA DE CORTES REQUERIDOS</h2>
    <div class="cut-items">
      ${cuts.map(cut => `
        <div class="cut-item">
          <strong>${cut.length} mm</strong><br>
          Cantidad: ${cut.quantity}x<br>
          <span style="color: #64748b;">Total: ${cut.length * cut.quantity} mm</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="pipes-section">
    <h2>🔧 DISTRIBUCIÓN DE CORTES POR CAÑO</h2>
    
    ${groupedPipes.map((pipeGroup: any, groupIndex: number) => {
      const usedLength = pipeGroup.cuts.reduce((sum: number, cut: number) => sum + cut + optimization.kerf, 0) - optimization.kerf;
      const wasteLength = stockLength - usedLength;
      const efficiency = ((usedLength / stockLength) * 100).toFixed(1);
      
      return `
        <div class="pipe-card">
          <div class="pipe-header">
            <div class="pipe-number">
              ${pipeGroup.count > 1 ? `${pipeGroup.count}× CAÑOS (configuración idéntica)` : `CAÑO ÚNICO`}
            </div>
            <div class="pipe-stats">
              Usado: ${usedLength}mm | Desperdicio: ${wasteLength}mm | Eficiencia: ${efficiency}%
            </div>
          </div>
          
          <div class="pipe-visual">
            ${pipeGroup.cuts.map((cut: number) => {
              const widthPercent = ((cut + optimization.kerf) / stockLength) * 100;
              return `<div class="cut-segment" style="width: ${widthPercent}%">${cut}mm</div>`;
            }).join('')}
            ${wasteLength > 0 ? `
              <div class="waste-segment" style="width: ${(wasteLength / stockLength) * 100}%">
                ${wasteLength}mm
              </div>
            ` : ''}
          </div>
          
          <div class="cuts-detail">
            ${pipeGroup.cuts.map((cut: number, idx: number) => `
              <span class="cut-tag">#${idx + 1}: ${cut}mm</span>
            `).join('')}
            ${pipeGroup.count > 1 ? `
              <span class="cut-tag" style="background: #fef3c7; border-color: #fbbf24; color: #92400e;">
                ⚠️ Repetir ${pipeGroup.count} veces
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <div class="notes">
    <h3>📌 NOTAS IMPORTANTES</h3>
    <ul>
      <li>Verificar las medidas antes de comenzar el corte</li>
      <li>Los cortes están optimizados para minimizar el desperdicio</li>
      ${kerfEnabled ? `<li>Se ha incluido ${optimization.kerf}mm de kerf entre cada corte</li>` : ''}
      <li>Marcar cada pieza cortada para identificarla correctamente</li>
      <li>Conservar los retazos útiles para futuros trabajos</li>
    </ul>
  </div>

  <div class="footer">
    Generado con MSH Tube Optimizer
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 md:p-8">
      <style jsx global>{`
        .steel-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(71, 85, 105, 0.3);
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -1px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 0 rgba(148, 163, 184, 0.1);
        }

        .steel-input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.5);
          color: #e2e8f0;
          transition: all 0.2s ease;
        }

        .steel-input:focus {
          outline: none;
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
          background: rgba(15, 23, 42, 0.8);
        }

        .btn-primary {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          border: 1px solid rgba(56, 189, 248, 0.3);
          box-shadow: 
            0 4px 6px -1px rgba(14, 165, 233, 0.3),
            0 2px 4px -1px rgba(14, 165, 233, 0.2),
            inset 0 -1px 0 0 rgba(2, 132, 199, 0.5);
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
          box-shadow: 
            0 6px 8px -1px rgba(14, 165, 233, 0.4),
            0 4px 6px -1px rgba(14, 165, 233, 0.3),
            inset 0 -1px 0 0 rgba(2, 132, 199, 0.5);
          transform: translateY(-1px);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
          transform: scale(1.05);
        }

        .pipe-visualization {
          background: linear-gradient(180deg, rgba(51, 65, 85, 0.4) 0%, rgba(30, 41, 59, 0.4) 100%);
          border: 2px solid rgba(71, 85, 105, 0.4);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .pipe-visualization::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 49px,
            rgba(148, 163, 184, 0.1) 49px,
            rgba(148, 163, 184, 0.1) 50px
          );
          pointer-events: none;
        }

        .cut-segment {
          background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
          border-right: 3px solid #1e293b;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .cut-segment:hover {
          background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            0 4px 12px rgba(14, 165, 233, 0.4);
          transform: translateY(-2px);
        }

        .waste-segment {
          background: repeating-linear-gradient(
            45deg,
            rgba(248, 113, 113, 0.3),
            rgba(248, 113, 113, 0.3) 10px,
            rgba(220, 38, 38, 0.3) 10px,
            rgba(220, 38, 38, 0.3) 20px
          );
          border-left: 2px dashed rgba(248, 113, 113, 0.6);
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%);
          border: 1px solid rgba(14, 165, 233, 0.2);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%);
          border-color: rgba(14, 165, 233, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.2);
        }

        .title-glow {
          text-shadow: 0 0 20px rgba(56, 189, 248, 0.5), 0 0 40px rgba(56, 189, 248, 0.3);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .grid-pattern {
          background-image: 
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .cut-item {
          transition: all 0.3s ease;
        }

        .cut-item:hover {
          transform: translateX(4px);
        }
      `}</style>

      <div className="max-w-7xl mx-auto grid-pattern rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4 title-glow" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            MSH Tube Optimizer
          </h1>
          <p className="text-slate-400 text-lg tracking-wide">
            Sistema de optimización de cortes para caños • Minimiza desperdicios
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panel de Control */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configuración de Stock */}
            <div className="steel-card rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-sky-400" size={24} />
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  CAÑO STOCK
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 tracking-wide">
                    Longitud (mm)
                  </label>
                  <input
                    type="number"
                    value={stockLength}
                    onChange={(e) => setStockLength(parseFloat(e.target.value) || 6000)}
                    className="w-full px-4 py-3 rounded-lg steel-input font-mono text-lg"
                    min="100"
                    step="100"
                  />
                </div>
                
                {/* Kerf Toggle */}
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-slate-400 tracking-wide flex items-center gap-2">
                      <Scissors size={16} className="text-sky-400" />
                      Incluir Kerf (ancho de corte)
                    </label>
                    <button
                      onClick={() => setKerfEnabled(!kerfEnabled)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        kerfEnabled ? 'bg-sky-500' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          kerfEnabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {kerfEnabled && (
                    <div className="animate-fade-in">
                      <label className="block text-sm text-slate-400 mb-2 tracking-wide">
                        Ancho del kerf (mm)
                      </label>
                      <input
                        type="number"
                        value={kerfWidth}
                        onChange={(e) => setKerfWidth(parseFloat(e.target.value) || 3)}
                        className="w-full px-4 py-3 rounded-lg steel-input font-mono text-lg"
                        min="0"
                        step="0.5"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Espacio entre cortes según tu herramienta
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agregar Cortes */}
            <div className="steel-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-4">
                <Scissors className="text-sky-400" size={24} />
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  NUEVO CORTE
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 tracking-wide">
                    Longitud (mm)
                  </label>
                  <input
                    type="number"
                    value={newCutLength}
                    onChange={(e) => setNewCutLength(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCut()}
                    className="w-full px-4 py-3 rounded-lg steel-input font-mono text-lg"
                    placeholder="Ej: 1500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 tracking-wide">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={newCutQuantity}
                    onChange={(e) => setNewCutQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 rounded-lg steel-input font-mono text-lg"
                    min="1"
                  />
                </div>
                <button
                  onClick={addCut}
                  className="w-full btn-primary text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  AGREGAR CORTE
                </button>
              </div>
            </div>

            {/* Lista de Cortes */}
            <div className="steel-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  CORTES
                </h2>
                <span className="text-sm bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full font-bold">
                  {totalCutsCount} piezas
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cuts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No hay cortes agregados</p>
                  </div>
                ) : (
                  cuts.map((cut, index) => (
                    <div
                      key={cut.id}
                      className="cut-item flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 animate-slide-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300 font-bold">
                          {cut.quantity}×
                        </div>
                        <div>
                          <div className="font-mono text-lg font-bold text-sky-300">
                            {cut.length} mm
                          </div>
                          <div className="text-xs text-slate-500">
                            {cut.length * cut.quantity} mm total
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCut(cut.id)}
                        className="btn-danger p-2 rounded-lg text-white"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {optimization ? (
              <>
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Caños', value: optimization.totalPipes, icon: Package, color: 'sky' },
                    { label: 'Eficiencia', value: `${optimization.efficiency}%`, icon: TrendingDown, color: 'emerald' },
                    { label: 'Desperdicio', value: `${optimization.totalWaste}mm`, icon: AlertCircle, color: 'rose' },
                    { label: 'Total Corte', value: `${optimization.totalCutLength}mm`, icon: Scissors, color: 'amber' }
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`stat-card rounded-2xl p-6 animate-fade-in ${animateResults ? 'animate-fade-in' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <stat.icon className={`text-${stat.color}-400 mb-2`} size={24} />
                      <div className={`text-3xl font-black mb-1 text-${stat.color}-300`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visualización de Caños */}
                <div className="steel-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      DISTRIBUCIÓN OPTIMIZADA
                    </h2>
                    <button
                      onClick={exportToPrint}
                      className="btn-primary text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                    >
                      <Printer size={20} />
                      EXPORTAR PLAN
                    </button>
                  </div>
                  <div className="space-y-6">
                    {groupIdenticalPipes(optimization.pipes).map((pipeGroup: any, groupIndex: number) => {
                      const usedLength = pipeGroup.cuts.reduce((sum: number, cut: number) => sum + cut + optimization.kerf, 0) - optimization.kerf;
                      const wasteLength = stockLength - usedLength;
                      const efficiency = ((usedLength / stockLength) * 100).toFixed(1);

                      return (
                        <div 
                          key={groupIndex} 
                          className="animate-slide-in"
                          style={{ animationDelay: `${groupIndex * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-400">
                              {pipeGroup.count > 1 ? (
                                <span className="flex items-center gap-2">
                                  <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full font-bold">
                                    {pipeGroup.count}× CAÑOS
                                  </span>
                                  <span className="text-slate-500">
                                    (configuración idéntica)
                                  </span>
                                </span>
                              ) : (
                                `CAÑO ÚNICO`
                              )}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Usado: {usedLength}mm • Desperdicio: {wasteLength}mm • {efficiency}%
                            </span>
                          </div>
                          
                          <div className="pipe-visualization h-16 flex">
                            {pipeGroup.cuts.map((cut: number, cutIndex: number) => {
                              const widthPercent = ((cut + optimization.kerf) / stockLength) * 100;
                              return (
                                <div
                                  key={cutIndex}
                                  className="cut-segment flex items-center justify-center text-white font-bold text-xs relative group"
                                  style={{ width: `${widthPercent}%` }}
                                >
                                  <span className="relative z-10">{cut}mm</span>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              );
                            })}
                            {wasteLength > 0 && (
                              <div
                                className="waste-segment flex items-center justify-center text-red-300 font-bold text-xs"
                                style={{ width: `${(wasteLength / stockLength) * 100}%` }}
                              >
                                {wasteLength}mm
                              </div>
                            )}
                          </div>

                          {/* Detalle de cortes */}
                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            {pipeGroup.cuts.map((cut: number, cutIndex: number) => (
                              <span
                                key={cutIndex}
                                className="text-xs bg-sky-500/10 text-sky-300 px-2 py-1 rounded border border-sky-500/20 font-mono"
                              >
                                {cut}mm
                              </span>
                            ))}
                            {pipeGroup.count > 1 && (
                              <span className="text-xs text-slate-500 italic">
                                → Repetir {pipeGroup.count} veces
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nota sobre el kerf */}
                {kerfEnabled && (
                  <div className="steel-card rounded-2xl p-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-start gap-3 text-sm text-slate-400">
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-amber-400" />
                      <p>
                        <strong className="text-amber-300">Nota:</strong> Los cálculos incluyen {optimization.kerf}mm de kerf (ancho de corte) entre cada pieza. 
                        Ajusta según tu herramienta de corte.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="steel-card rounded-2xl p-12 text-center animate-fade-in">
                <Scissors className="mx-auto mb-4 text-slate-600" size={64} />
                <h3 className="text-2xl font-bold text-slate-500 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  ESPERANDO DATOS
                </h3>
                <p className="text-slate-600">
                  Agrega cortes para ver la optimización
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
