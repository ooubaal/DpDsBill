import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dbService } from './services/db';
import * as onedrive from './services/onedrive';
import { DocumentPrint } from './components/DocumentPrint';

// Intercept console logs for UI diagnostic reports
const debugLogs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  debugLogs.push(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
  originalLog.apply(console, args);
};
console.error = (...args) => {
  debugLogs.push(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
  originalError.apply(console, args);
};
console.warn = (...args) => {
  debugLogs.push(`[WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
  originalWarn.apply(console, args);
};


// Custom inline SVG icons for visual premium look without adding extra npm packages
const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>,
  Document: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Customer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Product: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  Sync: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
  Print: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  Convert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M12 20h.01" /><path d="M12 4h.01" /><path d="M4 12v.01" /><path d="M20 12v.01" /><path d="M19 19l-7-7" /><path d="M5 5l7 7" /></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [db, setDb] = useState(dbService.getDb());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(dbService.hasChanges);
  
  // Mobile Nav Menu Open
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync Status
  const [syncStatus, setSyncStatus] = useState('disconnected'); // 'synced', 'pending', 'syncing', 'disconnected'
  const [currentUser, setCurrentUser] = useState(null);
  const [azureClientId, setAzureClientId] = useState(onedrive.getSavedClientId());
  const [redirectUri, setRedirectUri] = useState(onedrive.getSavedRedirectUri());

  // CRUD & Form Modals state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null); // Document Editor structure
  const [previewingDoc, setPreviewingDoc] = useState(null); // Print Preview modal document
  const [showLogsModal, setShowLogsModal] = useState(false);

  // UI Filter lists
  const [docFilterType, setDocFilterType] = useState('all');
  
  // Form error notification
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Subscribe to Database Service updates
  useEffect(() => {
    const unsubscribe = dbService.subscribe((newDb, changes) => {
      setDb(JSON.parse(JSON.stringify(newDb)));
      setHasUnsavedChanges(changes);
      if (changes && syncStatus === 'synced') {
        setSyncStatus('pending');
      }
    });
    return unsubscribe;
  }, [syncStatus]);

  // 2. Auth Auto-Check on Start
  useEffect(() => {
    const checkAuth = async () => {
      const savedId = onedrive.getSavedClientId();
      if (savedId) {
        try {
          const user = await onedrive.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setSyncStatus('synced');
            // Auto sync download once connected
            triggerSyncDownload();
          } else {
            setSyncStatus('disconnected');
          }
        } catch (e) {
          console.error('MSAL silent login failed on startup', e);
          setErrorMsg(`การเชื่อมต่อระบบบัญชีล้มเหลว: ${e.message}`);
          setSyncStatus('disconnected');
        }
      }
    };
    checkAuth();
  }, []);

  // 3. Auto-Upload Debounce (Google Docs Style)
  useEffect(() => {
    if (hasUnsavedChanges && currentUser && syncStatus === 'pending') {
      const delayTimer = setTimeout(() => {
        triggerSyncUpload();
      }, 3000); // Wait 3 seconds of idle time to auto-save to OneDrive
      return () => clearTimeout(delayTimer);
    }
  }, [hasUnsavedChanges, currentUser, db, syncStatus]);

  // OneDrive Synchronize Actions
  const handleConnectOneDrive = async () => {
    console.log('[App] handleConnectOneDrive clicked. ClientID:', azureClientId, 'RedirectURI:', redirectUri);
    if (!azureClientId) {
      alert('กรุณากรอก Azure Client ID ก่อนเชื่อมต่อ');
      return;
    }
    setErrorMsg('');
    try {
      console.log('[App] Saving sync settings...');
      onedrive.saveSyncSettings(azureClientId, redirectUri);
      console.log('[App] Initiating onedrive.login()...');
      await onedrive.login(); // This redirects the page!
    } catch (e) {
      console.error(e);
      setErrorMsg(`เชื่อมต่อล้มเหลว: ${e.message}`);
      setSyncStatus('disconnected');
    }
  };

  const handleDisconnectOneDrive = async () => {
    try {
      await onedrive.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setSyncStatus('disconnected');
  };

  const triggerSyncDownload = async () => {
    const activeUser = await onedrive.getCurrentUser();
    if (!activeUser) return;
    setSyncStatus('syncing');
    try {
      const remoteDb = await onedrive.downloadDatabase();
      if (remoteDb) {
        const merged = dbService.mergeRemote(remoteDb);
        if (merged) {
          console.log('Merged remote database updates into local storage');
        }
        setSyncStatus('synced');
      } else {
        // Database file not found in OneDrive, let's upload our local one
        console.log('Database not found in OneDrive. Uploading local database...');
        await onedrive.uploadDatabase(dbService.getDb());
        setSyncStatus('synced');
        dbService.setChangesFlag(false);
      }
    } catch (e) {
      console.error('Failed to download/merge database:', e);
      setSyncStatus('disconnected');
      setErrorMsg(`ดาวน์โหลดฐานข้อมูลล้มเหลว: ${e.message}`);
    }
  };

  const triggerSyncUpload = async () => {
    const activeUser = await onedrive.getCurrentUser();
    if (!activeUser) return;
    setSyncStatus('syncing');
    try {
      await onedrive.uploadDatabase(dbService.getDb());
      setSyncStatus('synced');
      dbService.setChangesFlag(false);
    } catch (e) {
      console.error('Failed to upload database:', e);
      setSyncStatus('pending');
      setErrorMsg(`อัปโหลดฐานข้อมูลล้มเหลว: ${e.message}`);
    }
  };

  // Base64 File Readers for Logo & Signatures
  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dbService.updateCompanyProfile({ [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculations for Dashboard
  const stats = useMemo(() => {
    const docs = db.documents || [];
    const invoiceDocs = docs.filter(d => d.type === 'invoice');
    
    const totalSales = invoiceDocs
      .filter(d => d.status === 'paid')
      .reduce((sum, d) => sum + d.grandTotal, 0);

    const outstanding = invoiceDocs
      .filter(d => d.status === 'pending')
      .reduce((sum, d) => sum + d.grandTotal, 0);

    const qtVolume = docs.filter(d => d.type === 'quotation').length;
    const clientCount = db.customers?.length || 0;

    // Monthly Chart data: group invoices by month (YYYY-MM)
    const monthlySales = {};
    invoiceDocs.forEach(d => {
      if (d.status === 'paid' && d.date) {
        const monthKey = d.date.substring(0, 7); // "YYYY-MM"
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + d.grandTotal;
      }
    });

    const sortedMonths = Object.keys(monthlySales).sort().slice(-6); // last 6 months
    const chartData = sortedMonths.map(month => ({
      label: month,
      value: monthlySales[month]
    }));

    return {
      totalSales,
      outstanding,
      qtVolume,
      clientCount,
      chartData
    };
  }, [db]);

  // Document management helpers
  const handleOpenDocEditor = (doc = null) => {
    if (doc) {
      // Edit mode (deep clone to avoid inline mutation)
      setEditingDoc(JSON.parse(JSON.stringify(doc)));
    } else {
      // Create mode
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      setEditingDoc({
        id: '',
        type: 'quotation',
        docNumber: dbService.generateDocNumber('quotation', today),
        date: today,
        dueDate: nextMonthStr,
        customerId: '',
        customerName: '',
        customerAddress: '',
        customerTaxId: '',
        customerPhone: '',
        items: [{ description: '', quantity: 1, unit: 'งาน', price: 0, amount: 0 }],
        discount: 0,
        subtotal: 0,
        vatRate: 7,
        vatAmount: 0,
        grandTotal: 0,
        notes: 'กรุณาโอนเงินเข้าบัญชีธนาคารตามที่ระบุไว้ในเอกสารนี้',
        status: 'draft',
        linkedDocId: ''
      });
    }
  };

  const handleDocTypeChangeInEditor = (newType) => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      const generatedNo = dbService.generateDocNumber(newType, prev.date);
      let defaultNotes = prev.notes;
      if (newType === 'receipt') {
        defaultNotes = 'ขอบคุณที่ใช้บริการ';
      }
      return {
        ...prev,
        type: newType,
        docNumber: generatedNo,
        notes: defaultNotes
      };
    });
  };

  const handleDocDateChangeInEditor = (newDate) => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      const generatedNo = dbService.generateDocNumber(prev.type, newDate);
      return {
        ...prev,
        date: newDate,
        docNumber: generatedNo
      };
    });
  };

  const handleSelectCustomerForDoc = (customerId) => {
    const cust = db.customers.find(c => c.id === customerId);
    if (cust && editingDoc) {
      setEditingDoc(prev => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name,
        customerAddress: cust.address,
        customerTaxId: cust.taxId || '',
        customerPhone: cust.phone || ''
      }));
    }
  };

  const handleAddDocItem = () => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      const newItems = [...prev.items, { description: '', quantity: 1, unit: 'งาน', price: 0, amount: 0 }];
      return recalcDocTotals({ ...prev, items: newItems });
    });
  };

  const handleRemoveDocItem = (index) => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      const newItems = prev.items.filter((_, idx) => idx !== index);
      return recalcDocTotals({ ...prev, items: newItems.length ? newItems : [{ description: '', quantity: 1, unit: 'งาน', price: 0, amount: 0 }] });
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      const newItems = prev.items.map((item, idx) => {
        if (idx !== index) return item;
        
        let val = value;
        if (field === 'quantity') val = parseInt(value, 10) || 0;
        if (field === 'price') val = parseFloat(value) || 0;
        
        const updatedItem = { ...item, [field]: val };
        updatedItem.amount = updatedItem.quantity * updatedItem.price;
        return updatedItem;
      });
      return recalcDocTotals({ ...prev, items: newItems });
    });
  };

  const handleQuickAddProductToDoc = (product) => {
    if (!editingDoc) return;
    setEditingDoc(prev => {
      // Find if we have an empty first row to fill, otherwise append
      let newItems = [...prev.items];
      const firstItem = newItems[0];
      if (newItems.length === 1 && !firstItem.description && firstItem.price === 0) {
        newItems[0] = {
          description: product.name,
          quantity: 1,
          unit: product.unit || 'งาน',
          price: product.price,
          amount: product.price
        };
      } else {
        newItems.push({
          description: product.name,
          quantity: 1,
          unit: product.unit || 'งาน',
          price: product.price,
          amount: product.price
        });
      }
      return recalcDocTotals({ ...prev, items: newItems });
    });
  };

  const recalcDocTotals = (docObj) => {
    const itemsTotal = docObj.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const subtotal = Math.max(0, itemsTotal - docObj.discount);
    const vatAmount = Math.round((subtotal * (docObj.vatRate / 100)) * 100) / 100;
    const grandTotal = subtotal + vatAmount;

    return {
      ...docObj,
      subtotal,
      vatAmount,
      grandTotal
    };
  };

  const handleSaveDoc = () => {
    if (!editingDoc.customerName) {
      alert('กรุณาเลือกหรือระบุชื่อลูกค้า');
      return;
    }
    if (editingDoc.items.some(item => !item.description)) {
      alert('กรุณากรอกชื่อรายการรายละเอียดสินค้าให้ครบทุกแถว');
      return;
    }
    dbService.saveDocument(editingDoc);
    setEditingDoc(null);
  };

  // Conversion workflows (e.g. Quotation -> Invoice)
  const handleConvertDoc = (sourceDoc, targetType) => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const converted = {
      ...JSON.parse(JSON.stringify(sourceDoc)), // deep copy values
      id: '',
      type: targetType,
      docNumber: dbService.generateDocNumber(targetType, today),
      date: today,
      dueDate: nextMonth.toISOString().split('T')[0],
      status: targetType === 'receipt' ? 'paid' : 'pending',
      linkedDocId: sourceDoc.docNumber, // Store link back
      updatedAt: new Date().toISOString()
    };
    
    setEditingDoc(converted);
    setActiveTab('documents');
  };

  // Customer Crud
  const handleSaveCustomerForm = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const customer = {
      id: editingCustomer.id || '',
      name: fd.get('name'),
      address: fd.get('address'),
      taxId: fd.get('taxId'),
      phone: fd.get('phone'),
      email: fd.get('email')
    };

    if (!customer.name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }

    dbService.saveCustomer(customer);
    setEditingCustomer(null);
  };

  // Product Crud
  const handleSaveProductForm = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const product = {
      id: editingProduct.id || '',
      code: fd.get('code'),
      name: fd.get('name'),
      unit: fd.get('unit'),
      price: parseFloat(fd.get('price')) || 0
    };

    if (!product.name) {
      alert('กรุณากรอกชื่อสินค้า/บริการ');
      return;
    }

    dbService.saveProduct(product);
    setEditingProduct(null);
  };

  // Filter documents computed property
  const filteredDocuments = useMemo(() => {
    let docs = db.documents || [];
    if (docFilterType !== 'all') {
      docs = docs.filter(d => d.type === docFilterType);
    }
    // Sort newest documents first
    return [...docs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db, docFilterType]);

  return (
    <div className="app-container">
      {/* Mobile Header Bar */}
      <div className="hamburger-container" style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 1001 }}>
        <button className="hamburger btn btn-secondary btn-icon-only" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? Icons.Close() : Icons.Dashboard()}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">
            {Icons.Product()}
            <span>DpDsBill</span>
          </div>
        </div>

        <nav className="nav-links">
          <li>
            <button 
              className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            >
              {Icons.Dashboard()} แดชบอร์ด
            </button>
          </li>
          <li>
            <button 
              className={`nav-button ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => { setActiveTab('documents'); setIsSidebarOpen(false); }}
            >
              {Icons.Document()} เอกสารบิลทั้งหมด
            </button>
          </li>
          <li>
            <button 
              className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
            >
              {Icons.Customer()} ฐานข้อมูลลูกค้า
            </button>
          </li>
          <li>
            <button 
              className={`nav-button ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
            >
              {Icons.Product()} แคตตาล็อกสินค้า
            </button>
          </li>
          <li>
            <button 
              className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            >
              {Icons.Settings()} ตั้งค่า & คีย์ซิงก์
            </button>
          </li>
        </nav>

        {/* OneDrive Sync Widget */}
        <div className="sync-status-widget">
          <div className="sync-status-header">
            <span style={{ fontWeight: '500' }}>OneDrive Sync</span>
            <span className={`sync-badge ${syncStatus}`}>
              {syncStatus === 'synced' && 'เชื่อมต่อแล้ว'}
              {syncStatus === 'pending' && 'รอดำเนินการ'}
              {syncStatus === 'syncing' && 'กำลังซิงก์...'}
              {syncStatus === 'disconnected' && 'ไม่ได้เชื่อมต่อ'}
            </span>
          </div>
          {currentUser ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '8px', wordBreak: 'break-all' }}>
                ผู้ใช้: {currentUser.username}
              </p>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                onClick={triggerSyncDownload}
                disabled={syncStatus === 'syncing'}
              >
                {Icons.Sync()} ซิงก์ทันที
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              สามารถตั้งค่าซิงก์ข้อมูลไปที่คลาวด์ได้ในแถบการตั้งค่า
            </p>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Top bar with quick states */}
        <header className="top-header">
          <div className="page-title">
            <h1 style={{ textTransform: 'capitalize' }}>
              {activeTab === 'dashboard' && 'ภาพรวมธุรกิจ'}
              {activeTab === 'documents' && 'ระบบการจัดการเอกสาร'}
              {activeTab === 'customers' && 'ฐานข้อมูลคู่ค้า / ลูกค้า'}
              {activeTab === 'products' && 'รายการสินค้าและบริการ'}
              {activeTab === 'settings' && 'การตั้งค่าระบบ'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'สรุปผลประกอบการ ยอดค้างชำระ และข้อมูลล่าสุด'}
              {activeTab === 'documents' && 'ออกใบเสนอราคา ใบกำกับภาษี ใบวางบิล และใบเสร็จรับเงิน'}
              {activeTab === 'customers' && 'จัดการรายชื่อผู้ซื้อและที่อยู่จัดส่งเอกสาร'}
              {activeTab === 'products' && 'จัดการสินค้าสำเร็จรูป แคตตาล็อกบริการ และอัตราค่าบริการมาตรฐาน'}
              {activeTab === 'settings' && 'จัดการข้อมูลโปรไฟล์บริษัท อัปโหลดลายเซ็น และซิงก์คีย์ Azure AD'}
            </p>
          </div>

          <div className="header-actions">
            {hasUnsavedChanges && (
              <span style={{ color: 'var(--color-warning)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }}></span>
                มีข้อมูลที่ยังไม่ซิงก์
              </span>
            )}
            {activeTab === 'documents' && (
              <button className="btn btn-primary" onClick={() => handleOpenDocEditor()}>
                {Icons.Plus()} สร้างเอกสารใหม่
              </button>
            )}
            {activeTab === 'customers' && (
              <button className="btn btn-primary" onClick={() => setEditingCustomer({ id: '', name: '', address: '', taxId: '', phone: '', email: '' })}>
                {Icons.Plus()} เพิ่มลูกค้าใหม่
              </button>
            )}
            {activeTab === 'products' && (
              <button className="btn btn-primary" onClick={() => setEditingProduct({ id: '', code: '', name: '', unit: 'งาน', price: 0 })}>
                {Icons.Plus()} เพิ่มสินค้า / บริการ
              </button>
            )}
          </div>
        </header>

        {errorMsg && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-danger)', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.1)' }}>
            <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{errorMsg}</p>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Quick Stats Grid */}
            <div className="dashboard-grid">
              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span>ยอดขายสุทธิสะสม (ใบเสร็จ)</span>
                  <div className="stat-icon" style={{ color: 'var(--color-success)' }}>{Icons.Product()}</div>
                </div>
                <div className="stat-value text-success">
                  ฿{stats.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </div>
                <div className="stat-trend trend-up">
                  {Icons.Sync()} อัปเดตล่าสุด
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span>ยอดค้างชำระ (ใบกำกับภาษี)</span>
                  <div className="stat-icon" style={{ color: 'var(--color-warning)' }}>{Icons.Document()}</div>
                </div>
                <div className="stat-value text-warning" style={{ color: 'var(--color-warning)' }}>
                  ฿{stats.outstanding.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </div>
                <div className="stat-trend text-muted">
                  รอเรียกเก็บเงินจากคู่ค้า
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span>จำนวนใบเสนอราคา</span>
                  <div className="stat-icon" style={{ color: 'var(--color-info)' }}>{Icons.Customer()}</div>
                </div>
                <div className="stat-value">{stats.qtVolume}</div>
                <div className="stat-trend trend-up">
                  รายการเสนอราคาที่ยื่นเสนอ
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span>จำนวนลูกค้ารายย่อย / คู่ค้า</span>
                  <div className="stat-icon">{Icons.User()}</div>
                </div>
                <div className="stat-value">{stats.clientCount}</div>
                <div className="stat-trend text-muted">
                  ลงทะเบียนแล้วในระบบ
                </div>
              </div>
            </div>

            {/* Main Area: Charts & Quick Documents */}
            <div className="doc-editor-grid">
              {/* Recent Documents */}
              <div className="glass-card" style={{ flexGrow: 1 }}>
                <h3 style={{ marginBottom: '1.25rem' }}>เอกสารล่าสุด</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>เลขที่เอกสาร</th>
                        <th>ประเภท</th>
                        <th>ลูกค้า</th>
                        <th>วันที่เอกสาร</th>
                        <th className="text-right">ยอดรวม</th>
                        <th>สถานะ</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.documents.slice(0, 5).map(doc => (
                        <tr key={doc.id}>
                          <td><strong>{doc.docNumber}</strong></td>
                          <td>
                            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                              {doc.type === 'quotation' && 'ใบเสนอราคา'}
                              {doc.type === 'invoice' && 'ใบกำกับภาษี'}
                              {doc.type === 'billing' && 'ใบวางบิล'}
                              {doc.type === 'receipt' && 'ใบเสร็จรับเงิน'}
                            </span>
                          </td>
                          <td>{doc.customerName}</td>
                          <td>{doc.date}</td>
                          <td className="text-right">฿{doc.grandTotal.toLocaleString('th-TH')}</td>
                          <td>
                            <span className={`status-badge ${doc.status}`}>
                              {doc.status === 'draft' && 'ฉบับร่าง'}
                              {doc.status === 'pending' && 'ค้างชำระ'}
                              {doc.status === 'paid' && 'ชำระแล้ว'}
                              {doc.status === 'cancelled' && 'ยกเลิก'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary btn-icon-only" onClick={() => setPreviewingDoc(doc)}>
                                {Icons.Print()}
                              </button>
                              <button className="btn btn-secondary btn-icon-only" onClick={() => handleOpenDocEditor(doc)}>
                                {Icons.Edit()}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {db.documents.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem' }}>
                            ไม่มีเอกสารบิลในฐานข้อมูล กดปุ่มสร้างเอกสารใหม่เพื่อเริ่มต้น
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Stats Summary */}
              <div className="glass-card" style={{ minWidth: '300px' }}>
                <h3 style={{ marginBottom: '1.25rem' }}>ยอดขายรายเดือน (บาท)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  {stats.chartData.map((data, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        <span>{data.label}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>฿{data.value.toLocaleString()}</span>
                      </div>
                      {/* Simple CSS-based bar chart */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, (data.value / (stats.totalSales || 1)) * 100)}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                  {stats.chartData.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '3rem' }}>
                      ไม่มีประวัติการชำระเงินที่บันทึกไว้
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DOCUMENTS ================= */}
        {activeTab === 'documents' && (
          <div className="glass-card">
            {/* Filter buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div className="tabs-nav" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <button 
                  className={`btn ${docFilterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDocFilterType('all')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  ทั้งหมด
                </button>
                <button 
                  className={`btn ${docFilterType === 'quotation' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDocFilterType('quotation')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  ใบเสนอราคา (QT)
                </button>
                <button 
                  className={`btn ${docFilterType === 'invoice' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDocFilterType('invoice')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  ใบกำกับภาษี (INV)
                </button>
                <button 
                  className={`btn ${docFilterType === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDocFilterType('billing')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  ใบวางบิล (BL)
                </button>
                <button 
                  className={`btn ${docFilterType === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDocFilterType('receipt')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  ใบเสร็จรับเงิน (RE)
                </button>
              </div>
            </div>

            {/* List */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>เลขที่เอกสาร</th>
                    <th>วันที่</th>
                    <th>ลูกค้า</th>
                    <th className="text-right">ยอดรวมสุทธิ</th>
                    <th>สถานะ</th>
                    <th>เชื่อมโยง</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id}>
                      <td><strong>{doc.docNumber}</strong></td>
                      <td>{doc.date}</td>
                      <td>{doc.customerName}</td>
                      <td className="text-right" style={{ fontWeight: '600' }}>
                        ฿{doc.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`status-badge ${doc.status}`}>
                          {doc.status === 'draft' && 'ฉบับร่าง'}
                          {doc.status === 'pending' && 'ค้างชำระ'}
                          {doc.status === 'paid' && 'ชำระเงินแล้ว'}
                          {doc.status === 'cancelled' && 'ยกเลิกแล้ว'}
                        </span>
                      </td>
                      <td>
                        {doc.linkedDocId ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                            จาก {doc.linkedDocId}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="พิมพ์เอกสาร / Preview"
                            onClick={() => setPreviewingDoc(doc)}
                          >
                            {Icons.Print()}
                          </button>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="แก้ไขเอกสาร"
                            onClick={() => handleOpenDocEditor(doc)}
                          >
                            {Icons.Edit()}
                          </button>
                          
                          {/* Conversion Quick Actions */}
                          {doc.type === 'quotation' && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', gap: '0.2rem' }}
                              onClick={() => handleConvertDoc(doc, 'invoice')}
                              title="แปลงเป็น ใบแจ้งหนี้/ใบกำกับภาษี"
                            >
                              {Icons.Convert()} แปลงเป็น INV
                            </button>
                          )}
                          {doc.type === 'invoice' && doc.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', gap: '0.2rem' }}
                                onClick={() => handleConvertDoc(doc, 'billing')}
                                title="แปลงเป็น ใบวางบิล"
                              >
                                {Icons.Convert()} วางบิล
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', gap: '0.2rem' }}
                                onClick={() => handleConvertDoc(doc, 'receipt')}
                                title="แปลงเป็น ใบเสร็จรับเงิน"
                              >
                                {Icons.Convert()} รับเงิน
                              </button>
                            </>
                          )}
                          
                          <button 
                            className="btn btn-danger btn-icon-only" 
                            title="ลบเอกสาร"
                            onClick={() => {
                              if (window.confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) {
                                dbService.deleteDocument(doc.id);
                              }
                            }}
                          >
                            {Icons.Trash()}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem' }}>
                        ไม่พบเอกสารตามประเภทที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUSTOMERS ================= */}
        {activeTab === 'customers' && (
          <div className="glass-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ชื่อลูกค้า / บริษัท</th>
                    <th>เลขผู้เสียภาษี</th>
                    <th>ที่อยู่จัดส่งบิล</th>
                    <th>เบอร์โทรศัพท์</th>
                    <th>อีเมล</th>
                    <th style={{ width: '120px' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {db.customers.map(cust => (
                    <tr key={cust.id}>
                      <td><strong>{cust.name}</strong></td>
                      <td>{cust.taxId || '-'}</td>
                      <td>{cust.address}</td>
                      <td>{cust.phone || '-'}</td>
                      <td>{cust.email || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-icon-only" onClick={() => setEditingCustomer(cust)}>
                            {Icons.Edit()}
                          </button>
                          <button 
                            className="btn btn-danger btn-icon-only"
                            onClick={() => {
                              if (window.confirm('ยืนยันลบลูกค้ารายนี้จากระบบ?')) {
                                dbService.deleteCustomer(cust.id);
                              }
                            }}
                          >
                            {Icons.Trash()}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {db.customers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem' }}>
                        ไม่มีข้อมูลลูกค้าในระบบ กดปุ่มเพิ่มลูกค้าใหม่เพื่อเพิ่มที่อยู่สำหรับการจัดส่งบิล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PRODUCTS ================= */}
        {activeTab === 'products' && (
          <div className="glass-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>รหัสสินค้า</th>
                    <th>รายการสินค้า / การบริการ</th>
                    <th>หน่วยนับ</th>
                    <th className="text-right">ราคากลาง / หน่วย</th>
                    <th style={{ width: '120px' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {db.products.map(prod => (
                    <tr key={prod.id}>
                      <td><code>{prod.code || '-'}</code></td>
                      <td><strong>{prod.name}</strong></td>
                      <td>{prod.unit || 'งาน'}</td>
                      <td className="text-right" style={{ fontWeight: '600' }}>
                        ฿{(prod.price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-icon-only" onClick={() => setEditingProduct(prod)}>
                            {Icons.Edit()}
                          </button>
                          <button 
                            className="btn btn-danger btn-icon-only"
                            onClick={() => {
                              if (window.confirm('ยืนยันลบรายการสินค้านี้ใช่หรือไม่?')) {
                                dbService.deleteProduct(prod.id);
                              }
                            }}
                          >
                            {Icons.Trash()}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {db.products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem' }}>
                        ไม่มีสินค้าหรือบริการในแคตตาล็อกสินค้า กดปุ่มเพิ่มสินค้าใหม่เพื่อเริ่มต้นสร้างประวัติรายการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SETTINGS & SYNC ================= */}
        {activeTab === 'settings' && (
          <div className="doc-editor-grid">
            {/* Left: Company Profile Settings */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>ข้อมูลบริษัท (ผู้ออกเอกสาร)</h3>
              
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">ชื่อผู้จดทะเบียน (ภาษาไทย / อังกฤษ)</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.name}
                    onChange={(e) => dbService.updateCompanyProfile({ name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เลขผู้เสียภาษี (13 หลัก)</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.taxId}
                    onChange={(e) => dbService.updateCompanyProfile({ taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ที่อยู่บริษัท (ที่ใช้แสดงในหัวบิล)</label>
                <textarea 
                  rows="3"
                  className="input-control" 
                  value={db.companyProfile.address}
                  onChange={(e) => dbService.updateCompanyProfile({ address: e.target.value })}
                />
              </div>

              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.phone}
                    onChange={(e) => dbService.updateCompanyProfile({ phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">อีเมลติดต่อ</label>
                  <input 
                    type="email" 
                    className="input-control" 
                    value={db.companyProfile.email}
                    onChange={(e) => dbService.updateCompanyProfile({ email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เว็บไซต์</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.website}
                    onChange={(e) => dbService.updateCompanyProfile({ website: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ margin: '1.5rem 0 0.75rem 0', color: 'var(--text-secondary)' }}>รายละเอียดธนาคาร (สำหรับโอนเงิน)</h4>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">ชื่อธนาคาร</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.bankName}
                    onChange={(e) => dbService.updateCompanyProfile({ bankName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เลขที่บัญชี</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.bankAccountNo}
                    onChange={(e) => dbService.updateCompanyProfile({ bankAccountNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ชื่อบัญชีธนาคาร</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={db.companyProfile.bankAccountName}
                    onChange={(e) => dbService.updateCompanyProfile({ bankAccountName: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ margin: '1.5rem 0 0.75rem 0', color: 'var(--text-secondary)' }}>ไฟล์ตราประทับ / โลโก้ และ ลายมือชื่อ</h4>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">โลโก้บริษัท (PNG/JPG)</label>
                  <div className="image-upload-box" onClick={() => document.getElementById('logo-file').click()}>
                    {db.companyProfile.logo ? (
                      <img src={db.companyProfile.logo} alt="Company Logo" />
                    ) : (
                      <>
                        {Icons.Product()}
                        <span>คลิกเพื่ออัปโหลดโลโก้</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      id="logo-file" 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ลายเซ็นกรรมการ + ตราประทับ (แนะนำไฟล์ฉลากโปร่งแสง)</label>
                  <div className="image-upload-box" onClick={() => document.getElementById('sig-file').click()}>
                    {db.companyProfile.signature ? (
                      <img src={db.companyProfile.signature} alt="Authorized Signature" />
                    ) : (
                      <>
                        {Icons.Edit()}
                        <span>คลิกเพื่ออัปโหลดลายเซ็น</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      id="sig-file" 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'signature')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Azure AD OneDrive Sync Settings */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                ซิงก์ข้อมูลด้วย Microsoft Azure & OneDrive
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                ซิงก์ข้อมูลใบเสนอราคาและลูกค้าของคุณข้ามแพลตฟอร์ม (PC, Mobile, Tablet) โดยเก็บข้อมูลไว้ที่โฟลเดอร์ <code>/DpDsBill/db.json</code> ใน OneDrive ส่วนตัวของคุณ
              </p>

              <div className="form-group">
                <label className="form-label">Microsoft Entra ID Application (Client) ID</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="เช่น c252c803-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={azureClientId}
                  onChange={(e) => setAzureClientId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Redirect URI (ที่ตรงกับแอปพลิเคชันของคุณใน Azure Portal)</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  ค่าเริ่มต้น: <code>{window.location.origin + window.location.pathname}</code>
                </span>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {currentUser ? (
                    <button className="btn btn-danger" style={{ flexGrow: 1 }} onClick={handleDisconnectOneDrive}>
                      {Icons.Close()} ออกจากระบบ OneDrive
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ flexGrow: 1 }} onClick={handleConnectOneDrive}>
                      {Icons.Sync()} เชื่อมต่อ & ซิงก์ข้อมูล
                    </button>
                  )}
                </div>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ width: '100%' }}
                  onClick={() => setShowLogsModal(true)}
                >
                  {Icons.Document()} ดูรายงานระบบ (Debug Logs)
                </button>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  คู่มือการตั้งค่า Azure App Registration ใน 2 นาที:
                </strong>
                <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <li>เข้าสู่หน้าแรกของ <a href="https://entra.microsoft.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>Microsoft Entra portal</a> ด้วยบัญชี Microsoft ส่วนบุคคลหรือสถาบัน</li>
                  <li>ไปที่ <strong>Applications</strong> &gt; <strong>App registrations</strong> &gt; คลิก <strong>New registration</strong></li>
                  <li>ตั้งชื่อแอป เช่น <code>DpDsBill App</code></li>
                  <li>เลือกบัญชีที่รองรับเป็น: <strong>Accounts in any organizational directory and personal Microsoft accounts</strong> (หรือแบบอื่นที่คุณใช้)</li>
                  <li>ในส่วน Redirect URI เลือกประเภทเป็น <strong>Single-page application (SPA)</strong> และวาง URL นี้ลงไป: <code>{redirectUri}</code></li>
                  <li>กดปุ่ม <strong>Register</strong> แล้วคัดลอกค่า <strong>Application (client) ID</strong> มาใส่ด้านบน</li>
                  <li>ไปที่แท็บ <strong>API Permissions</strong> &gt; ตรวจสอบว่ามีสิทธิ์ <code>Files.ReadWrite</code> สำหรับ Microsoft Graph (หากไม่มีให้ค้นหาและเพิ่มสิทธิ์ลงไป)</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: CUSTOMER EDIT FORM ================= */}
        {editingCustomer && (
          <div className="modal-overlay">
            <div className="modal-content glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>{editingCustomer.id ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มรายชื่อลูกค้าใหม่'}</h2>
                <button className="btn btn-secondary btn-icon-only" onClick={() => setEditingCustomer(null)}>{Icons.Close()}</button>
              </div>

              <form onSubmit={handleSaveCustomerForm}>
                <div className="form-group">
                  <label className="form-label">ชื่อผู้จดทะเบียน / ชื่อร้านค้าลูกค้า</label>
                  <input type="text" name="name" className="input-control" defaultValue={editingCustomer.name} placeholder="เช่น บริษัท ช้อปปิ้งออนไลน์ จำกัด" required />
                </div>

                <div className="form-group">
                  <label className="form-label">เลขผู้เสียภาษีอากร (13 หลัก)</label>
                  <input type="text" name="taxId" className="input-control" defaultValue={editingCustomer.taxId} placeholder="ถ้ามี (สำหรับออกใบกำกับภาษี)" />
                </div>

                <div className="form-group">
                  <label className="form-label">ที่อยู่สำหรับการจัดส่งเอกสารบิล</label>
                  <textarea rows="3" name="address" className="input-control" defaultValue={editingCustomer.address} placeholder="ระบุเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" required />
                </div>

                <div className="input-row">
                  <div className="form-group">
                    <label className="form-label">เบอร์โทรศัพท์ติดต่อ</label>
                    <input type="text" name="phone" className="input-control" defaultValue={editingCustomer.phone} placeholder="เช่น 089-XXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">อีเมลจัดส่งใบเสร็จ</label>
                    <input type="email" name="email" className="input-control" defaultValue={editingCustomer.email} placeholder="เช่น billing@customer.com" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingCustomer(null)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: PRODUCT EDIT FORM ================= */}
        {editingProduct && (
          <div className="modal-overlay">
            <div className="modal-content glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>{editingProduct.id ? 'แก้ไขรายละเอียดสินค้า' : 'เพิ่มรายการสินค้า / บริการ'}</h2>
                <button className="btn btn-secondary btn-icon-only" onClick={() => setEditingProduct(null)}>{Icons.Close()}</button>
              </div>

              <form onSubmit={handleSaveProductForm}>
                <div className="input-row">
                  <div className="form-group">
                    <label className="form-label">รหัสสินค้า (SKU)</label>
                    <input type="text" name="code" className="input-control" defaultValue={editingProduct.code} placeholder="เช่น SRV-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หน่วยนับ</label>
                    <input type="text" name="unit" className="input-control" defaultValue={editingProduct.unit} placeholder="เช่น งาน, ชิ้น, แพ็ค" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ชื่อรายการสินค้าหรือขอบเขตบริการ</label>
                  <input type="text" name="name" className="input-control" defaultValue={editingProduct.name} placeholder="เช่น บริการดูแลระบบเซิร์ฟเวอร์รายปี" required />
                </div>

                <div className="form-group">
                  <label className="form-label">อัตราค่าบริการมาตรฐาน (บาท)</label>
                  <input type="number" step="any" name="price" className="input-control" defaultValue={editingProduct.price} placeholder="0.00" required />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary">บันทึกสินค้า</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: DOCUMENT CREATOR & EDITOR ================= */}
        {editingDoc && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="modal-content glass-card" style={{ maxWidth: '1000px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingDoc.id ? 'แก้ไขเอกสารบิล' : 'สร้างเอกสารใหม่'}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>#{editingDoc.docNumber}</span>
                  </h2>
                </div>
                <button className="btn btn-secondary btn-icon-only" onClick={() => setEditingDoc(null)}>{Icons.Close()}</button>
              </div>

              <div className="doc-editor-grid">
                {/* Left side: Itemized & Meta inputs */}
                <div>
                  <div className="input-row">
                    <div className="form-group">
                      <label className="form-label">ประเภทเอกสาร</label>
                      <select 
                        className="input-control" 
                        value={editingDoc.type} 
                        onChange={(e) => handleDocTypeChangeInEditor(e.target.value)}
                      >
                        <option value="quotation">ใบเสนอราคา (QT)</option>
                        <option value="invoice">ใบแจ้งหนี้ / ใบกำกับภาษี (INV)</option>
                        <option value="billing">ใบวางบิล (BL)</option>
                        <option value="receipt">ใบเสร็จรับเงิน / ใบกำกับภาษี (RE)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">เลขที่เอกสาร</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={editingDoc.docNumber} 
                        onChange={(e) => setEditingDoc(prev => ({ ...prev, docNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="input-row">
                    <div className="form-group">
                      <label className="form-label">วันที่เอกสาร</label>
                      <input 
                        type="date" 
                        className="input-control" 
                        value={editingDoc.date}
                        onChange={(e) => handleDocDateChangeInEditor(e.target.value)}
                      />
                    </div>

                    {editingDoc.type !== 'receipt' && (
                      <div className="form-group">
                        <label className="form-label">วันครบกำหนด (Due date)</label>
                        <input 
                          type="date" 
                          className="input-control" 
                          value={editingDoc.dueDate}
                          onChange={(e) => setEditingDoc(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">สถานะการชำระเงิน</label>
                      <select 
                        className="input-control" 
                        value={editingDoc.status}
                        onChange={(e) => setEditingDoc(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="draft">ฉบับร่าง (Draft)</option>
                        <option value="pending">ค้างชำระ (Pending)</option>
                        <option value="paid">ชำระแล้ว (Paid)</option>
                        <option value="cancelled">ยกเลิก (Cancelled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      ลูกค้าคู่ค้า (เลือกจากฐานข้อมูลเพื่อดึงข้อมูลอัตโนมัติ)
                    </label>
                    <select 
                      className="input-control" 
                      value={editingDoc.customerId}
                      onChange={(e) => handleSelectCustomerForDoc(e.target.value)}
                    >
                      <option value="">-- เลือกรายชื่อลูกค้า / หรือกรอกข้อมูลด้านล่าง --</option>
                      {db.customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Details Overwrites */}
                  <div className="input-row">
                    <div className="form-group" style={{ flexGrow: 2 }}>
                      <label className="form-label">ชื่อผู้จดทะเบียนลูกค้า</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={editingDoc.customerName}
                        onChange={(e) => setEditingDoc(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="เช่น บจก. ลูกค้าทดสอบ"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">เลขผู้เสียภาษีลูกค้า</label>
                      <input 
                        type="text" 
                        className="input-control" 
                        value={editingDoc.customerTaxId}
                        onChange={(e) => setEditingDoc(prev => ({ ...prev, customerTaxId: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ที่อยู่จัดส่งบิลลูกค้า</label>
                    <textarea 
                      rows="2"
                      className="input-control" 
                      value={editingDoc.customerAddress}
                      onChange={(e) => setEditingDoc(prev => ({ ...prev, customerAddress: e.target.value }))}
                    />
                  </div>

                  {/* Items List inside Document Creator */}
                  <h4 style={{ margin: '1.5rem 0 0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>รายการสินค้า / บริการในเอกสาร</span>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={handleAddDocItem}>
                      {Icons.Plus()} เพิ่มแถวรายการ
                    </button>
                  </h4>

                  <table className="doc-items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>รายละเอียดสินค้า / การบริการ</th>
                        <th style={{ width: '12%' }}>จำนวน</th>
                        <th style={{ width: '13%' }}>หน่วย</th>
                        <th style={{ width: '18%' }}>ราคาต่อหน่วย</th>
                        <th style={{ width: '7%', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingDoc.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input 
                              type="text" 
                              className="input-control" 
                              value={item.description} 
                              onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                              placeholder="เช่น ค่าพัฒนาซอฟต์แวร์เฟส 1"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="input-control" 
                              value={item.quantity} 
                              onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                              style={{ textAlign: 'center' }}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="input-control" 
                              value={item.unit} 
                              onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                              style={{ textAlign: 'center' }}
                              placeholder="งาน"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="input-control" 
                              value={item.price} 
                              onChange={(e) => handleItemFieldChange(idx, 'price', e.target.value)}
                              style={{ textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-danger btn-icon-only" style={{ width: '32px', height: '32px' }} onClick={() => handleRemoveDocItem(idx)}>
                              {Icons.Close()}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Remark Notes */}
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label">หมายเหตุท้ายเอกสารบิล</label>
                    <textarea 
                      rows="2"
                      className="input-control" 
                      value={editingDoc.notes}
                      onChange={(e) => setEditingDoc(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Right side: Catalog picker & Financial Summary */}
                <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>แคตตาล็อกด่วน</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    กดเพื่อเพิ่มรายละเอียดสินค้านี้เข้าไปในเอกสารด้านซ้ายมือทันที
                  </p>
                  
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {db.products.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleQuickAddProductToDoc(p)}
                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', transition: 'var(--transition-smooth)' }}
                        className="catalog-item-hover"
                      >
                        <span style={{ fontWeight: '500' }}>{p.name}</span>
                        <span style={{ color: 'var(--accent-secondary)' }}>฿{p.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {db.products.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                        ไม่มีสินค้าในคลังสินค้าด่วน
                      </p>
                    )}
                  </div>

                  <h4 style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                    สรุปผลการเงินในเอกสาร
                  </h4>

                  <div className="doc-summary">
                    <div className="form-group">
                      <label className="form-label">ส่วนลดพิเศษท้ายบิล (บาท)</label>
                      <input 
                        type="number" 
                        className="input-control" 
                        value={editingDoc.discount}
                        onChange={(e) => setEditingDoc(prev => recalcDocTotals({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        style={{ textAlign: 'right' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">อัตราภาษีมูลค่าเพิ่ม (%)</label>
                      <select 
                        className="input-control" 
                        value={editingDoc.vatRate}
                        onChange={(e) => setEditingDoc(prev => recalcDocTotals({ ...prev, vatRate: parseInt(e.target.value, 10) || 0 }))}
                      >
                        <option value="7">7% (มาตรฐาน)</option>
                        <option value="0">0% (ยกเว้นภาษี)</option>
                      </select>
                    </div>

                    <div className="summary-row" style={{ marginTop: '0.75rem' }}>
                      <span>ราคารวมสินค้า:</span>
                      <span>฿{editingDoc.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {editingDoc.discount > 0 && (
                      <div className="summary-row" style={{ color: 'var(--color-danger)' }}>
                        <span>หักส่วนลด:</span>
                        <span>-฿{editingDoc.discount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>ยอดก่อนภาษีสุทธิ:</span>
                      <span>฿{editingDoc.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="summary-row">
                      <span>ภาษีมูลค่าเพิ่ม ({editingDoc.vatRate}%):</span>
                      <span>฿{editingDoc.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="summary-row total">
                      <span>ยอดสุทธิรวมทั้งสิ้น:</span>
                      <span>฿{editingDoc.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDoc(null)}>ยกเลิก</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveDoc}>บันทึกข้อมูลและปิด</button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: PRINT PREVIEW MODAL ================= */}
        {previewingDoc && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '2.5rem', paddingBottom: '2.5rem', overflowY: 'auto' }}>
            <div className="modal-content" style={{ maxWidth: '850px', background: '#475569', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: 'white' }}>
                <h2 style={{ color: 'white' }}>ตัวอย่างหน้าพิมพ์เอกสารบิล</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.print()}
                    style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', boxShadow: 'none' }}
                  >
                    {Icons.Print()} สั่งพิมพ์บิล (A4 / PDF)
                  </button>
                  <button className="btn btn-secondary" style={{ color: 'white' }} onClick={() => setPreviewingDoc(null)}>
                    {Icons.Close()} ปิดหน้าต่าง
                  </button>
                </div>
              </div>

              {/* Printable Component Renders Here */}
              <div style={{ background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
                <DocumentPrint document={previewingDoc} companyProfile={db.companyProfile} />
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: DEBUG LOGS ================= */}
        {showLogsModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>รายงานระบบ (Debug Logs)</h2>
                <button className="btn btn-secondary btn-icon-only" onClick={() => setShowLogsModal(false)}>{Icons.Close()}</button>
              </div>
              <textarea 
                readOnly
                rows="15"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '10px', background: 'black', color: '#10b981', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                value={debugLogs.join('\n')}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setShowLogsModal(false)}>ปิดหน้าต่าง</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
