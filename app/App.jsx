import React, { useState } from 'react';
import { FileSpreadsheet, Plus, Trash2, Download, Eye, FolderOpen, Package, Boxes, ChevronDown, ChevronUp, BarChart3, Layers, FileCheck, Sun, Moon, FileText, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelGenerator = () => {
  // Configuración del proyecto
  const [proyecto, setProyecto] = useState('');
  const [idProyecto, setIdProyecto] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  
  // Import file state
  const [importing, setImporting] = useState(false);
  
  // Tipo de item (pieza o conjunto)
  const [tipoItem, setTipoItem] = useState('pieza'); // 'pieza' o 'conjunto'
  
  // Items (pueden ser piezas o conjuntos)
  const [items, setItems] = useState([
    { 
      id: 1, 
      nombrePieza: '', 
      cantidad: '', 
      materiaPrima: '',
      tipoServicio: 'Interno',
      proveedor: '',
      procurementGroupId: 101,
      componenteLote: [{ nombre: '', lote: '', demandas: '', color: '#6366f1' }],
      collapsed: false
    }
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [nextId, setNextId] = useState(102);

  // Color palette for components
  const componentColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
  ];

  // Lista de proveedores con sus IDs
  const proveedores = [
    { id: '', nombre: 'Ninguno' },
    { id: 46436, nombre: 'DRUETTA HNOS. S.A.' },
    { id: 46692, nombre: 'GALVANIZACION LANUS SRL' },
    { id: 46693, nombre: 'GALVANIZADOS SANZ S.A.' },
    { id: 46694, nombre: 'GALVANOPLASTIA CAROLO S.R.L.' },
    { id: 46695, nombre: 'GALVASA S.A.' },
    { id: 47279, nombre: 'METALURGICA MEGA COLOR S.R.L.' },
    { id: 47657, nombre: 'REYPER S.A.' },
    { id: 47914, nombre: 'T.D.A. ANODIZADO S.A' }
  ];



  const addItem = () => {
    const newItem = {
      id: Date.now(),
      nombrePieza: '',
      cantidad: '',
      materiaPrima: '',
      tipoServicio: 'Interno',
      proveedor: '',
      procurementGroupId: nextId,
      componenteLote: tipoItem === 'conjunto' ? [{ nombre: '', lote: '', demandas: '', color: componentColors[0] }] : [],
      collapsed: false
    };
    // Collapse all existing items and add new item at the beginning
    const collapsedItems = items.map(item => ({ ...item, collapsed: true }));
    setItems([newItem, ...collapsedItems]);
    setNextId(nextId + 1);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleCollapse = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, collapsed: !item.collapsed } : item
    ));
  };

  const addComponenteLote = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId && Array.isArray(item.componenteLote)) {
        const currentComp = item.componenteLote[0] || { nombre: '', lote: '', demandas: '', color: componentColors[0] };
        const nextColorIndex = item.componenteLote.length % componentColors.length;
        // Add current value to the list and reset the input field
        return { 
          ...item, 
          componenteLote: [
            { nombre: '', lote: '', demandas: '', color: componentColors[nextColorIndex] }, 
            currentComp, 
            ...item.componenteLote.slice(1)
          ] 
        };
      }
      return item;
    }));
  };

  const removeComponenteLote = (itemId, loteIndex) => {
    setItems(items.map(item => {
      if (item.id === itemId && Array.isArray(item.componenteLote) && item.componenteLote.length > 2) {
        const newLotes = item.componenteLote.filter((_, idx) => idx !== loteIndex);
        return { ...item, componenteLote: newLotes };
      }
      return item;
    }));
  };

  const updateComponenteLote = (itemId, loteIndex, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId && Array.isArray(item.componenteLote)) {
        const newLotes = [...item.componenteLote];
        newLotes[loteIndex] = { ...newLotes[loteIndex], [field]: value };
        return { ...item, componenteLote: newLotes };
      }
      return item;
    }));
  };

  const generateRemito = () => {
    // Generar datos para Remito Temporal
    const dataRemito = items.map(item => ({
      'Producto/Nombre': proyecto,
      'Número de serie/lote': item.nombrePieza,
      'Cantidad Producida': parseInt(item.cantidad) || 0,
      'Tipo de servicio': item.tipoServicio,
      'Proveedor': item.proveedor ? proveedores.find(p => p.id === parseInt(item.proveedor))?.nombre || item.proveedor : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataRemito);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Remito Temporal');
    
    const fileName = `${proyecto.replace(/[^a-z0-9]/gi, '_')}_Remito_Temporal.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const importExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Detectar tipo según el nombre de la hoja
      const sheetName = workbook.SheetNames[0];
      const isPieza = sheetName === 'OFs - PS';
      const isConjunto = sheetName === 'OFs - Conjuntos';
      
      if (!isPieza && !isConjunto) {
        alert('El archivo no tiene el formato correcto. Debe tener una hoja llamada "OFs - PS" o "OFs - Conjuntos"');
        setImporting(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('El archivo está vacío');
        setImporting(false);
        return;
      }

      // Establecer tipo de item
      setTipoItem(isPieza ? 'pieza' : 'conjunto');

      // Extraer datos del proyecto (de la primera fila)
      const firstRow = jsonData[0];
      setProyecto(firstRow['Producto'] || '');
      
      // Extraer ID de proyecto desde Distribución analítica
      const distribucion = firstRow['Distribución analítica'] || '';
      const match = distribucion.match(/\{\"(\d+)\"/);
      if (match) {
        setIdProyecto(match[1]);
      }

      // Procesar items
      const importedItems = [];
      let currentItem = null;
      let nextProcurementId = 101;

      jsonData.forEach((row, index) => {
        // Si tiene Producto, es un item nuevo
        if (row['Producto']) {
          // Guardar el item anterior si existe
          if (currentItem) {
            importedItems.push(currentItem);
          }

          // Buscar ID del proveedor por nombre
          let proveedorId = '';
          if (row['Proveedor']) {
            const prov = proveedores.find(p => p.id === parseInt(row['Proveedor']));
            proveedorId = prov ? prov.id : row['Proveedor'];
          }

          // Crear nuevo item
          currentItem = {
            id: Date.now() + index,
            nombrePieza: row['Origen'] || '',
            cantidad: row['Cantidad a producir'] || '',
            materiaPrima: row['Componentes/Producto'] || '',
            tipoServicio: row['Tipo de servicio'] || 'Interno',
            proveedor: proveedorId,
            procurementGroupId: row['procurement_group_id'] || nextProcurementId++,
            componenteLote: isConjunto ? [{ 
              nombre: '', // Los excels existentes no tienen nombre, quedará vacío
              lote: row['Componentes/Lote'] || '', 
              demandas: row['Componentes/Demandas'] || '',
              color: componentColors[0]
            }] : [],
            collapsed: true
          };
        } else if (currentItem && isConjunto && row['Componentes/Lote']) {
          // Es una fila adicional de componente/lote
          const nextColorIndex = currentItem.componenteLote.length % componentColors.length;
          currentItem.componenteLote.push({
            nombre: '',
            lote: row['Componentes/Lote'] || '',
            demandas: row['Componentes/Demandas'] || '',
            color: componentColors[nextColorIndex]
          });
        }
      });

      // Agregar el último item
      if (currentItem) {
        // El primero debe estar expandido
        currentItem.collapsed = false;
        importedItems.push(currentItem);
      }

      // Invertir para que el primero quede arriba
      setItems(importedItems.reverse());
      setNextId(nextProcurementId);

      alert(`✅ Archivo importado correctamente!\n${importedItems.length} ${isPieza ? 'piezas' : 'conjuntos'} cargados.`);
      
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('Error al importar el archivo. Asegúrate de que sea un Excel válido generado por esta aplicación.');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const generateExcel = () => {
    // Generar formato de distribución analítica
    const distribucionAnalitica = idProyecto ? `{"${idProyecto}": 100.0}` : '';

    if (tipoItem === 'pieza') {
      // Generar datos para hoja OFs - PS
      const dataPiezas = items.map(item => ({
        'Producto': proyecto,
        'Cantidad a producir': parseInt(item.cantidad) || 0,
        'Ubicación de productos terminados': 'MSH/Stock',
        'Componentes/Producto': item.materiaPrima,
        'Componentes/Lote': null,
        'Ubicación de los componentes': 'MSH/Stock',
        'Componentes/Demandas': 0,
        'Distribución analítica': distribucionAnalitica,
        'Origen': item.nombrePieza,
        'Responsable': 'Joaquin Urien',
        'Tipo de servicio': item.tipoServicio,
        'Proveedor': item.proveedor || null,
        'procurement_group_id': item.procurementGroupId
      }));

      const ws = XLSX.utils.json_to_sheet(dataPiezas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'OFs - PS');
      
      const fileName = `${proyecto.replace(/[^a-z0-9]/gi, '_')}_Piezas_OFs.xlsx`;
      XLSX.writeFile(wb, fileName);
    } else {
      // Generar datos para hoja OFs - Conjuntos
      const dataConjuntos = [];
      
      items.forEach(item => {
        const lotes = Array.isArray(item.componenteLote) 
          ? item.componenteLote.filter((l, i) => i > 0 && l && l.lote) // Skip first (input field) and empty values
          : [];
        
        if (lotes.length === 0) {
          // If no components added yet, just add main row
          dataConjuntos.push({
            'Producto': proyecto,
            'Cantidad a producir': parseInt(item.cantidad) || 0,
            'Ubicación de productos terminados': 'MSH/Stock',
            'Componentes/Producto': item.materiaPrima,
            'Componentes/Lote': '',
            'Ubicación de los componentes': 'MSH/Stock',
            'Componentes/Demandas': 0,
            'Distribución analítica': distribucionAnalitica,
            'Origen': item.nombrePieza,
            'Responsable': 'Joaquin Urien',
            'Tipo de servicio': item.tipoServicio,
            'Proveedor': item.proveedor || null,
            'procurement_group_id': item.procurementGroupId
          });
        } else {
          // Primera fila con todos los datos
          dataConjuntos.push({
            'Producto': proyecto,
            'Cantidad a producir': parseInt(item.cantidad) || 0,
            'Ubicación de productos terminados': 'MSH/Stock',
            'Componentes/Producto': item.materiaPrima,
            'Componentes/Lote': lotes[0].lote || '',
            'Ubicación de los componentes': 'MSH/Stock',
            'Componentes/Demandas': parseInt(lotes[0].demandas) || 0,
            'Distribución analítica': distribucionAnalitica,
            'Origen': item.nombrePieza,
            'Responsable': 'Joaquin Urien',
            'Tipo de servicio': item.tipoServicio,
            'Proveedor': item.proveedor || null,
            'procurement_group_id': item.procurementGroupId
          });
          
          // Filas adicionales solo con Componentes/Lote y Demandas
          for (let i = 1; i < lotes.length; i++) {
            dataConjuntos.push({
              'Producto': '',
              'Cantidad a producir': null,
              'Ubicación de productos terminados': '',
              'Componentes/Producto': '',
              'Componentes/Lote': lotes[i].lote || '',
              'Ubicación de los componentes': '',
              'Componentes/Demandas': parseInt(lotes[i].demandas) || 0,
              'Distribución analítica': '',
              'Origen': '',
              'Responsable': '',
              'Tipo de servicio': '',
              'Proveedor': null,
              'procurement_group_id': null
            });
          }
        }
      });

      const ws = XLSX.utils.json_to_sheet(dataConjuntos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'OFs - Conjuntos');
      
      const fileName = `${proyecto.replace(/[^a-z0-9]/gi, '_')}_Conjuntos_OFs.xlsx`;
      XLSX.writeFile(wb, fileName);
    }
  };

  const isFormValid = () => {
    return proyecto &&
           idProyecto &&
           items.every(item => 
             item.nombrePieza && 
             item.cantidad && 
             parseInt(item.cantidad) > 0 && 
             item.materiaPrima
           );
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900'
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Archivo:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Archivo', sans-serif;
        }
        
        .mono {
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .card {
          background: ${theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)'};
          backdrop-filter: blur(10px);
          border: 1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.3)'};
          transition: all 0.3s ease;
          box-shadow: ${theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
        }
        
        .card:hover {
          border-color: ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.4)'};
          transform: translateY(-2px);
          box-shadow: ${theme === 'dark' ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 20px 40px rgba(0, 0, 0, 0.15)'};
        }
        
        input, select {
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.4)'};
          color: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
          transition: all 0.2s ease;
        }
        
        input:focus, select:focus {
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 1)'};
          border-color: rgba(99, 102, 241, 0.5);
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        }
        
        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          transition: all 0.2s ease;
        }
        
        .btn-danger:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }
        
        .label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: ${theme === 'dark' ? 'rgba(148, 163, 184, 0.9)' : 'rgba(71, 85, 105, 0.9)'};
        }
        
        .tab {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }
        
        .tab.active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
          color: white;
        }
        
        .tab:not(.active) {
          background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)'};
          color: ${theme === 'dark' ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.8)'};
        }
        
        .tab:not(.active):hover {
          background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.9)'};
          color: ${theme === 'dark' ? 'rgba(148, 163, 184, 1)' : 'rgba(71, 85, 105, 1)'};
        }
        
        .preview-table {
          font-size: 0.8rem;
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.6)'};
        }
        
        .preview-table th {
          background: rgba(99, 102, 241, 0.2);
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border-bottom: 2px solid rgba(99, 102, 241, 0.3);
        }
        
        .preview-table td {
          padding: 0.75rem;
          border-bottom: 1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'};
        }
        
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }

        .required::after {
          content: ' *';
          color: #ef4444;
        }
        
        .theme-toggle {
          background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.4)'};
          transition: all 0.2s ease;
        }
        
        .theme-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Theme Toggle and Import Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <input
              type="file"
              id="excel-import"
              accept=".xlsx,.xls"
              onChange={importExcel}
              className="hidden"
            />
            <label
              htmlFor="excel-import"
              className={`theme-toggle px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg cursor-pointer ${
                importing ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <Upload className="w-5 h-5 text-indigo-500" />
              <span className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                {importing ? 'Importando...' : 'Importar Excel'}
              </span>
            </label>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="theme-toggle px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 text-yellow-400" />
                <span className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-indigo-600" />
                <span className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-2xl">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-5xl font-bold mb-3 ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent' 
              : 'text-slate-900'
          }`}>
            Generador de Órdenes de Fabricación
          </h1>
          <p className={`text-lg mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Crea archivos Excel listos para importar
          </p>
        </div>

        {/* Project Configuration Card */}
        <div className="card rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center mb-6">
            <FolderOpen className="w-6 h-6 text-indigo-400 mr-3" />
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Configuración del Proyecto
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label block mb-2 required">Proyecto</label>
              <input
                type="text"
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                placeholder="ej: 6523 - Modulos SUM CUYO"
                className="w-full px-4 py-3 rounded-xl text-slate-100"
              />
              <p className="text-xs text-slate-500 mt-2 mono">Este valor se exporta en la columna "Producto"</p>
            </div>

            <div>
              <label className="label block mb-2 required">ID de Proyecto</label>
              <input
                type="text"
                value={idProyecto}
                onChange={(e) => setIdProyecto(e.target.value)}
                placeholder="ej: 909"
                className="w-full px-4 py-3 rounded-xl text-slate-100 mono"
              />
              <p className="text-xs text-slate-500 mt-2 mono">
                Se exporta como: {idProyecto ? `{"${idProyecto}": 100.0}` : '{"XXX": 100.0}'}
              </p>
            </div>
          </div>
        </div>

        {/* Type Selector */}
        <div className="card rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setTipoItem('pieza')}
              className={`tab flex items-center gap-2 ${tipoItem === 'pieza' ? 'active' : ''}`}
            >
              <Package className="w-5 h-5" />
              Piezas
            </button>
            <button
              onClick={() => setTipoItem('conjunto')}
              className={`tab flex items-center gap-2 ${tipoItem === 'conjunto' ? 'active' : ''}`}
            >
              <Boxes className="w-5 h-5" />
              Conjuntos
            </button>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4 mono">
            Hoja de Excel: <span className="text-indigo-400 font-semibold">
              {tipoItem === 'pieza' ? 'OFs - PS' : 'OFs - Conjuntos'}
            </span>
          </p>
        </div>

        {/* Items Card */}
        <div className="card rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {tipoItem === 'pieza' ? (
                <Package className="w-6 h-6 text-indigo-400 mr-3" />
              ) : (
                <Boxes className="w-6 h-6 text-indigo-400 mr-3" />
              )}
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {tipoItem === 'pieza' ? 'Piezas' : 'Conjuntos'}
              </h2>
              <span className="ml-4 badge">{items.length} {tipoItem === 'pieza' ? 'piezas' : 'conjuntos'}</span>
            </div>
            <button
              onClick={addItem}
              className="btn-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Agregar {tipoItem === 'pieza' ? 'Pieza' : 'Conjunto'}
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className={`rounded-xl border overflow-hidden transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/50 border-slate-300/50'
              }`}>
                {/* Header - Always visible */}
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                    theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-100/50'
                  }`}
                  onClick={() => toggleCollapse(item.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-semibold text-indigo-400 mono">
                      {tipoItem === 'pieza' ? 'PIEZA' : 'CONJUNTO'} #{items.length - index}
                    </span>
                    {item.nombrePieza && (
                      <span className={`text-sm truncate max-w-md ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.nombrePieza}
                      </span>
                    )}
                    {item.cantidad > 1 && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                        × {item.cantidad}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                      ID: {item.procurementGroupId}
                    </span>
                    {items.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="btn-danger p-2 rounded-lg"
                        title={`Eliminar ${tipoItem}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {item.collapsed ? (
                      <ChevronDown className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                    ) : (
                      <ChevronUp className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                    )}
                  </div>
                </div>

                {/* Collapsible content */}
                {!item.collapsed && (
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block mb-2 required">
                          {tipoItem === 'pieza' ? 'Nombre de Pieza' : 'Nombre de Conjunto'}
                        </label>
                        <input
                          type="text"
                          value={item.nombrePieza}
                          onChange={(e) => updateItem(item.id, 'nombrePieza', e.target.value)}
                          placeholder={tipoItem === 'pieza' ? 'ej: MODULO A 600x2659' : 'ej: Panel CR MESH 500x1000x75 - Blanco SM'}
                          className="w-full px-4 py-3 rounded-xl text-slate-100"
                        />
                        <p className="text-xs text-slate-500 mt-1 mono">Columna: Origen</p>
                      </div>

                      <div>
                        <label className="label block mb-2 required">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.id, 'cantidad', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-slate-100"
                        />
                        <p className="text-xs text-slate-500 mt-1 mono">Columna: Cantidad a producir</p>
                      </div>

                      <div>
                        <label className="label block mb-2 required">
                          {tipoItem === 'pieza' ? 'Materia Prima' : 'Producto a Consumir'}
                        </label>
                        <input
                          type="text"
                          value={item.materiaPrima}
                          onChange={(e) => updateItem(item.id, 'materiaPrima', e.target.value)}
                          placeholder={tipoItem === 'pieza' ? 'ej: P-FUND-PALE I-FX0073NT-6.00-1300-4100' : 'ej: PY 6552 - Piezas Sueltas'}
                          className="w-full px-4 py-3 rounded-xl text-slate-100"
                        />
                        <p className="text-xs text-slate-500 mt-1 mono">Columna: Componentes/Producto</p>
                      </div>

                      {tipoItem === 'conjunto' && (
                        <>
                          <div className="col-span-2">
                            <label className="label block mb-2">Componente/Lote y Demandas</label>
                            
                            {/* Input principal siempre arriba */}
                            <div className="mb-3 space-y-3">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: item.componenteLote[0]?.color || componentColors[0] }}
                                  title="Color identificador"
                                />
                                <input
                                  type="text"
                                  value={item.componenteLote[0]?.nombre || ''}
                                  onChange={(e) => updateComponenteLote(item.id, 0, 'nombre', e.target.value)}
                                  placeholder="Nombre del corte (ej: Corte A, Panel Superior)"
                                  className="flex-1 px-4 py-3 rounded-xl text-slate-100"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    value={item.componenteLote[0]?.lote || ''}
                                    onChange={(e) => updateComponenteLote(item.id, 0, 'lote', e.target.value)}
                                    placeholder="ej: Bandeja MD - 500x1000mm"
                                    className="w-full px-4 py-3 rounded-xl text-slate-100"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.componenteLote[0]?.demandas || ''}
                                    onChange={(e) => updateComponenteLote(item.id, 0, 'demandas', e.target.value)}
                                    placeholder="Demandas"
                                    className="w-full px-4 py-3 rounded-xl text-slate-100"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Botón para agregar más componentes */}
                            <button
                              onClick={() => addComponenteLote(item.id)}
                              className="w-full mb-3 text-sm bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar Otro Componente
                            </button>

                            {/* Componentes adicionales abajo */}
                            {Array.isArray(item.componenteLote) && item.componenteLote.length > 1 && (
                              <div className={`space-y-3 mt-3 pt-3 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300/50'} border-t`}>
                                <p className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Componentes Agregados ({item.componenteLote.filter((l, i) => i > 0 && l?.lote).length})
                                </p>
                                {item.componenteLote.slice(1).map((comp, idx) => {
                                  const loteIndex = idx + 1;
                                  // Skip empty values
                                  if (!comp || !comp.lote) return null;
                                  return (
                                    <div 
                                      key={loteIndex} 
                                      className={`p-4 rounded-lg border-l-4 ${
                                        theme === 'dark' 
                                          ? 'bg-slate-700/30' 
                                          : 'bg-slate-50'
                                      }`}
                                      style={{ borderLeftColor: comp.color || componentColors[0] }}
                                    >
                                      <div className="flex items-start gap-2 mb-3">
                                        <span className={`text-xs font-semibold mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                                          {idx + 1}.
                                        </span>
                                        <div className="flex-1 space-y-2">
                                          {/* Nombre editable */}
                                          <input
                                            type="text"
                                            value={comp.nombre || ''}
                                            onChange={(e) => updateComponenteLote(item.id, loteIndex, 'nombre', e.target.value)}
                                            placeholder="Nombre del corte"
                                            className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                                              theme === 'dark' 
                                                ? 'bg-slate-600/50 text-slate-100' 
                                                : 'bg-white text-slate-900'
                                            }`}
                                          />
                                          {/* Lote y Demandas editables */}
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-xs text-slate-500 mb-1 block">Lote:</label>
                                              <input
                                                type="text"
                                                value={comp.lote}
                                                onChange={(e) => updateComponenteLote(item.id, loteIndex, 'lote', e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                                  theme === 'dark' 
                                                    ? 'bg-slate-600/50 text-slate-100' 
                                                    : 'bg-white text-slate-900'
                                                }`}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-slate-500 mb-1 block">Demandas:</label>
                                              <input
                                                type="number"
                                                min="0"
                                                value={comp.demandas || ''}
                                                onChange={(e) => updateComponenteLote(item.id, loteIndex, 'demandas', e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                                  theme === 'dark' 
                                                    ? 'bg-slate-600/50 text-slate-100' 
                                                    : 'bg-white text-slate-900'
                                                }`}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => removeComponenteLote(item.id, loteIndex)}
                                          className="btn-danger p-2 rounded-lg mt-1"
                                          title="Eliminar componente"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <p className="text-xs text-slate-500 mt-2 mono">
                              Columnas: Componentes/Lote y Componentes/Demandas
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="label block mb-2">Tipo de Servicio</label>
                        <select
                          value={item.tipoServicio}
                          onChange={(e) => updateItem(item.id, 'tipoServicio', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-slate-100"
                        >
                          <option value="Interno">Interno</option>
                          <option value="Externo">Externo</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1 mono">Columna: Tipo de servicio</p>
                      </div>

                      <div>
                        <label className="label block mb-2">Proveedor</label>
                        <select
                          value={item.proveedor}
                          onChange={(e) => updateItem(item.id, 'proveedor', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-slate-100 text-sm"
                        >
                          {proveedores.map(prov => (
                            <option key={prov.id || 'ninguno'} value={prov.id}>
                              {prov.id ? `ID:${prov.id} - ${prov.nombre}` : prov.nombre}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1 mono">
                          Columna: Proveedor {item.proveedor ? `(ID: ${item.proveedor})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Auto-filled fields info */}
                    <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 mono">
                        <strong>Valores automáticos:</strong> Responsable: Joaquin Urien • 
                        Ubicaciones: MSH/Stock
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Cards - Compact Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-indigo-400 mb-1">{items.length}</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
              Registros
            </div>
          </div>

          <div className="card rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {items.reduce((sum, item) => sum + parseInt(item.cantidad || 0), 0)}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
              Cantidad
            </div>
          </div>

          <div className="card rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 shadow-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-green-400 mb-1 mono">
              {tipoItem === 'pieza' ? 'PS' : 'Conjuntos'}
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
              Tipo
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all shadow-lg ${
              theme === 'dark' 
                ? 'bg-slate-700/50 hover:bg-slate-700' 
                : 'bg-slate-200/80 hover:bg-slate-300'
            }`}
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Ocultar' : 'Ver'} Preview
          </button>

          <button
            onClick={generateRemito}
            disabled={!isFormValid()}
            className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-3 shadow-lg transition-all ${
              isFormValid()
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FileText className="w-5 h-5" />
            Generar Remito Temporal
          </button>

          <button
            onClick={generateExcel}
            disabled={!isFormValid()}
            className="btn-primary px-8 py-4 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
          >
            <Download className="w-5 h-5" />
            Generar Excel
          </button>
        </div>

        {/* Validation warning */}
        {!isFormValid() && (
          <div className="text-center mb-8">
            <p className="text-sm text-amber-400 mono">
              ⚠ Completa todos los campos requeridos (*) para generar el Excel
            </p>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="card rounded-2xl p-8 shadow-2xl mb-8">
            <h3 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Preview de Datos
            </h3>
            <div className="overflow-x-auto">
              <table className="preview-table w-full rounded-xl overflow-hidden">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>ID Proyecto</th>
                    <th>{tipoItem === 'pieza' ? 'Pieza' : 'Conjunto'}</th>
                    <th>Cantidad</th>
                    <th>{tipoItem === 'pieza' ? 'Materia Prima' : 'Producto a Consumir'}</th>
                    {tipoItem === 'conjunto' && <th>Componentes</th>}
                    <th>Servicio</th>
                    <th>Proveedor</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {items.map((item) => {
                    const lotes = Array.isArray(item.componenteLote) ? item.componenteLote.filter((l, i) => i > 0 && l && l.lote) : [];
                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30">
                        <td className="mono text-xs">{proyecto || '-'}</td>
                        <td className="mono text-xs">{idProyecto || '-'}</td>
                        <td>{item.nombrePieza || '-'}</td>
                        <td className="font-semibold text-indigo-400">{item.cantidad}</td>
                        <td className="mono text-xs">{item.materiaPrima || '-'}</td>
                        {tipoItem === 'conjunto' && (
                          <td className="text-xs">
                            {lotes.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {lotes.map((comp, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div 
                                      className="w-2 h-2 rounded-full flex-shrink-0" 
                                      style={{ backgroundColor: comp.color || componentColors[0] }}
                                    />
                                    <span className="text-xs">
                                      {idx + 1}. {comp.nombre ? `${comp.nombre} - ` : ''}{comp.lote} (Dem: {comp.demandas || 0})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        )}
                        <td>
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.tipoServicio === 'Interno' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.tipoServicio}
                          </span>
                        </td>
                        <td className="text-xs">
                          {item.proveedor ? (
                            proveedores.find(p => p.id === parseInt(item.proveedor))?.nombre || item.proveedor
                          ) : '-'}
                        </td>
                        <td className="mono text-sm text-slate-400">{item.procurementGroupId}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-500 mono">
            Creado por Norberto Echevarría
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExcelGenerator;
