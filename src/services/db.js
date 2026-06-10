const STORAGE_KEY = 'dpdsbill_local_db';
const CHANGES_KEY = 'dpdsbill_has_changes';

const initialDb = {
  companyProfile: {
    name: 'บริษัท ตัวอย่าง จำกัด',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    taxId: '0105500000000',
    phone: '02-123-4567',
    email: 'info@samplecompany.com',
    website: 'www.samplecompany.com',
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountNo: '000-0-00000-0',
    bankAccountName: 'บริษัท ตัวอย่าง จำกัด',
    logo: '',
    signature: '',
    updatedAt: new Date().toISOString()
  },
  customers: [],
  products: [],
  documents: [],
  meta: {
    lastSyncedAt: null,
    updatedAt: new Date().toISOString(),
    version: 1
  }
};

class DBService {
  constructor() {
    this.listeners = new Set();
    this.db = this.load();
    this.hasChanges = localStorage.getItem(CHANGES_KEY) === 'true';
  }

  // Load from localStorage or return default
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Deep merge with initialDb to ensure all fields exist
        return {
          ...initialDb,
          ...parsed,
          companyProfile: { ...initialDb.companyProfile, ...parsed.companyProfile },
          meta: { ...initialDb.meta, ...parsed.meta }
        };
      }
    } catch (e) {
      console.error('Failed to load local database, resetting', e);
    }
    return JSON.parse(JSON.stringify(initialDb)); // deep copy
  }

  // Save to localStorage and notify listeners
  save() {
    this.db.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    this.setChangesFlag(true);
    this.notify();
  }

  setChangesFlag(val) {
    this.hasChanges = val;
    localStorage.setItem(CHANGES_KEY, val ? 'true' : 'false');
    this.notify();
  }

  // Clear all data (reset)
  reset() {
    this.db = JSON.parse(JSON.stringify(initialDb));
    this.save();
    this.setChangesFlag(true);
  }

  // Subscriptions for React updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.db, this.hasChanges);
    }
  }

  getDb() {
    return this.db;
  }

  // Company Profile
  updateCompanyProfile(profile) {
    this.db.companyProfile = {
      ...this.db.companyProfile,
      ...profile,
      updatedAt: new Date().toISOString()
    };
    this.save();
  }

  // Customers (CRUD)
  getCustomers() {
    return this.db.customers || [];
  }

  saveCustomer(customer) {
    const now = new Date().toISOString();
    if (!customer.id) {
      // Create
      customer.id = 'cust_' + Date.now();
      customer.createdAt = now;
      customer.updatedAt = now;
      this.db.customers.push(customer);
    } else {
      // Update
      const idx = this.db.customers.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        customer.updatedAt = now;
        this.db.customers[idx] = { ...this.db.customers[idx], ...customer };
      } else {
        customer.updatedAt = now;
        this.db.customers.push(customer);
      }
    }
    this.save();
    return customer;
  }

  deleteCustomer(id) {
    this.db.customers = this.db.customers.filter(c => c.id !== id);
    this.save();
  }

  // Products (CRUD)
  getProducts() {
    return this.db.products || [];
  }

  saveProduct(product) {
    const now = new Date().toISOString();
    if (!product.id) {
      product.id = 'prod_' + Date.now();
      product.createdAt = now;
      product.updatedAt = now;
      this.db.products.push(product);
    } else {
      const idx = this.db.products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        product.updatedAt = now;
        this.db.products[idx] = { ...this.db.products[idx], ...product };
      } else {
        product.updatedAt = now;
        this.db.products.push(product);
      }
    }
    this.save();
    return product;
  }

  deleteProduct(id) {
    this.db.products = this.db.products.filter(p => p.id !== id);
    this.save();
  }

  // Documents (CRUD)
  getDocuments() {
    return this.db.documents || [];
  }

  saveDocument(document) {
    const now = new Date().toISOString();
    if (!document.id) {
      document.id = 'doc_' + Date.now();
      document.createdAt = now;
      document.updatedAt = now;
      this.db.documents.push(document);
    } else {
      const idx = this.db.documents.findIndex(d => d.id === document.id);
      if (idx !== -1) {
        document.updatedAt = now;
        this.db.documents[idx] = { ...this.db.documents[idx], ...document };
      } else {
        document.updatedAt = now;
        this.db.documents.push(document);
      }
    }
    this.save();
    return document;
  }

  deleteDocument(id) {
    this.db.documents = this.db.documents.filter(d => d.id !== id);
    this.save();
  }

  // Document Number Generator
  // Formats: QT-YYYYMM-XXX, INV-YYYYMM-XXX, BL-YYYYMM-XXX, RE-YYYYMM-XXX
  generateDocNumber(type, dateStr) {
    const prefixes = {
      quotation: 'QT',
      invoice: 'INV',
      billing: 'BL',
      receipt: 'RE'
    };
    const prefix = prefixes[type] || 'DOC';
    
    // Parse date to YYYYMM
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}${month}`; // e.g. "202606"

    const matchingDocs = this.db.documents.filter(d => {
      if (d.type !== type) return false;
      // Extract period from docNumber if matches prefix-period-XXX
      // e.g. "INV202606-001" or "INV-202606-001"
      const docNumClean = d.docNumber.replace(/[^0-9]/g, ''); // leaves digits: e.g. "202606001"
      return docNumClean.startsWith(period);
    });

    let maxSeq = 0;
    matchingDocs.forEach(d => {
      const parts = d.docNumber.split('-');
      const seqStr = parts[parts.length - 1]; // e.g. "001"
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}-${period}-${nextSeq}`;
  }

  // Merge remote DB (from OneDrive) into local DB
  // This performs a smart, non-destructive merge using timestamps
  mergeRemote(remoteDb) {
    if (!remoteDb) return;

    let merged = false;

    // 1. Merge Company Profile: take the newer one
    const localProfileTime = new Date(this.db.companyProfile.updatedAt || 0).getTime();
    const remoteProfileTime = new Date(remoteDb.companyProfile?.updatedAt || 0).getTime();
    if (remoteProfileTime > localProfileTime) {
      this.db.companyProfile = { ...remoteDb.companyProfile };
      merged = true;
    }

    // Helper to merge arrays of objects by ID and updatedAt
    const mergeArray = (localArr, remoteArr) => {
      const localMap = new Map(localArr.map(item => [item.id, item]));
      let changed = false;

      (remoteArr || []).forEach(remoteItem => {
        const localItem = localMap.get(remoteItem.id);
        if (!localItem) {
          // New remote item
          localMap.set(remoteItem.id, remoteItem);
          changed = true;
        } else {
          // Existing item: compare timestamps
          const localTime = new Date(localItem.updatedAt || 0).getTime();
          const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();
          if (remoteTime > localTime) {
            localMap.set(remoteItem.id, remoteItem);
            changed = true;
          }
        }
      });

      return {
        result: Array.from(localMap.values()),
        changed
      };
    };

    // 2. Merge Customers
    const customersMerge = mergeArray(this.db.customers, remoteDb.customers);
    if (customersMerge.changed) {
      this.db.customers = customersMerge.result;
      merged = true;
    }

    // 3. Merge Products
    const productsMerge = mergeArray(this.db.products, remoteDb.products);
    if (productsMerge.changed) {
      this.db.products = productsMerge.result;
      merged = true;
    }

    // 4. Merge Documents
    const documentsMerge = mergeArray(this.db.documents, remoteDb.documents);
    if (documentsMerge.changed) {
      this.db.documents = documentsMerge.result;
      merged = true;
    }

    // Update meta
    this.db.meta.lastSyncedAt = new Date().toISOString();
    
    if (merged) {
      // Save local updates
      this.db.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      this.setChangesFlag(false); // Clean since we merged and aligned
    } else {
      // No updates merged from remote, but let's record that we are in sync
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      this.setChangesFlag(false);
    }
    
    this.notify();
    return merged;
  }

  // Force overwrite local database with remote
  overwriteLocal(remoteDb) {
    if (!remoteDb) return;
    this.db = JSON.parse(JSON.stringify(remoteDb));
    this.db.meta.lastSyncedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    this.setChangesFlag(false);
    this.notify();
  }
}

export const dbService = new DBService();
