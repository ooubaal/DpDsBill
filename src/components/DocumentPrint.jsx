import React from 'react';
import { thaiBaht } from '../utils/thaiBaht';

export function DocumentPrint({ document, companyProfile }) {
  if (!document) return null;

  const {
    type,
    docNumber,
    date,
    dueDate,
    customerName,
    customerAddress,
    customerTaxId,
    customerPhone,
    items = [],
    discount = 0,
    subtotal = 0,
    vatRate = 7,
    vatAmount = 0,
    grandTotal = 0,
    notes = '',
    status = ''
  } = document;

  // Document Title translations
  const titles = {
    quotation: { th: 'ใบเสนอราคา', en: 'QUOTATION' },
    invoice: { th: 'ใบแจ้งหนี้ / ใบกำกับภาษี', en: 'INVOICE / TAX INVOICE' },
    billing: { th: 'ใบวางบิล', en: 'BILLING NOTE' },
    receipt: { th: 'ใบเสร็จรับเงิน / ใบกำกับภาษี', en: 'RECEIPT / TAX INVOICE' }
  };

  const currentTitle = titles[type] || { th: 'เอกสาร', en: 'DOCUMENT' };

  // Format Date (YYYY-MM-DD to DD/MM/YYYY or Thai format)
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`; // Thai Buddhist Era year
  };

  // Convert numbers to currency strings
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="print-document-container">
      <div className="screen-print-preview">
        {/* Header Section */}
        <div className="print-header">
          <div className="print-company-info">
            {companyProfile.logo && (
              <img src={companyProfile.logo} alt="Company Logo" className="print-logo" />
            )}
            <h2>{companyProfile.name}</h2>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
              <p>{companyProfile.address}</p>
              <p>โทร: {companyProfile.phone} | อีเมล: {companyProfile.email}</p>
              <p>เลขประจำตัวผู้เสียภาษี: <strong>{companyProfile.taxId}</strong></p>
            </div>
          </div>
          
          <div className="print-doc-meta">
            <h1>{currentTitle.th}</h1>
            <h3 style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600', marginBottom: '15px' }}>
              {currentTitle.en}
            </h3>
            
            <div className="print-meta-grid">
              <div>เลขที่เอกสาร / No.</div>
              <div>{docNumber}</div>
              
              <div>วันที่ / Date</div>
              <div>{formatDate(date)}</div>
              
              {type !== 'receipt' && (
                <>
                  <div>วันครบกำหนด / Due Date</div>
                  <div>{formatDate(dueDate)}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Client & Billing Info */}
        <div className="print-parties">
          <div className="print-party-col">
            <h3>ลูกค้า / Customer</h3>
            <p><strong>{customerName}</strong></p>
            <p style={{ marginTop: '4px', color: '#475569', fontSize: '0.85rem' }}>{customerAddress}</p>
            {customerPhone && <p style={{ fontSize: '0.85rem', color: '#475569' }}>โทร: {customerPhone}</p>}
            {customerTaxId && (
              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                เลขประจำตัวผู้เสียภาษี: {customerTaxId}
              </p>
            )}
          </div>
          <div className="print-party-col" style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '20px' }}>
            <h3>ข้อมูลการชำระเงิน / Payment Details</h3>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              โอนเงินเข้าบัญชี:<br />
              <strong>{companyProfile.bankName}</strong><br />
              ชื่อบัญชี: {companyProfile.bankAccountName}<br />
              เลขที่บัญชี: <strong>{companyProfile.bankAccountNo}</strong>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="print-items-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ลำดับ<br />No.</th>
              <th style={{ width: '47%' }}>รายการ<br />Description</th>
              <th style={{ width: '10%' }}>จำนวน<br />Qty</th>
              <th style={{ width: '10%' }}>หน่วย<br />Unit</th>
              <th style={{ width: '12%' }}>ราคา/หน่วย<br />Unit Price</th>
              <th style={{ width: '13%' }}>จำนวนเงิน<br />Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.description}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">{item.unit || 'งาน'}</td>
                <td className="text-right">{formatCurrency(item.price)}</td>
                <td className="text-right">{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
            {/* Pad empty rows if list is short (makes printing look consistent) */}
            {items.length < 5 && 
              Array.from({ length: 5 - items.length }).map((_, i) => (
                <tr key={`pad-${i}`} style={{ height: '32px' }}>
                  <td className="text-center">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Bottom Section: Notes & Summary */}
        <div className="print-bottom-section">
          <div className="print-notes-baht">
            <div className="print-baht-text-box">
              ({thaiBaht(grandTotal)})
            </div>
            
            <div className="print-notes">
              <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>
                หมายเหตุ / Remark:
              </strong>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                {notes || 'ไม่มีหมายเหตุเพิ่มเติม'}
              </div>
            </div>
          </div>

          <div className="print-financials">
            <table className="financial-table">
              <tbody>
                <tr>
                  <td>รวมเงิน / Subtotal</td>
                  <td className="text-right">{formatCurrency(subtotal + discount)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ color: '#dc2626' }}>ส่วนลด / Discount</td>
                    <td className="text-right" style={{ color: '#dc2626' }}>-{formatCurrency(discount)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td>ยอดหลักส่วนลด / Net Subtotal</td>
                    <td className="text-right">{formatCurrency(subtotal)}</td>
                  </tr>
                )}
                <tr>
                  <td>ภาษีมูลค่าเพิ่ม / VAT ({vatRate}%)</td>
                  <td className="text-right">{formatCurrency(vatAmount)}</td>
                </tr>
                <tr className="grand-total">
                  <td>จำนวนเงินทั้งสิ้น / Grand Total</td>
                  <td className="text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="print-signatures">
          {type === 'quotation' ? (
            <>
              <div className="signature-box">
                <p>อนุมัติสั่งซื้อโดย / Customer Acceptance</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: ................................</p>
              </div>
              <div className="signature-box">
                <p>ผู้เสนอราคา / Prepared By</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: {formatDate(date)}</p>
              </div>
              <div className="signature-box">
                <p>ผู้มีอำนาจลงนาม / Authorized Signature</p>
                <div className="signature-line">
                  {companyProfile.signature && (
                    <img src={companyProfile.signature} alt="Signature stamp" className="signature-img" />
                  )}
                </div>
                <p>วันที่ / Date: {formatDate(date)}</p>
              </div>
            </>
          ) : type === 'billing' ? (
            <>
              <div className="signature-box">
                <p>ผู้รับวางบิล / Customer Recipient</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: ................................</p>
              </div>
              <div className="signature-box">
                <p>ผู้วางบิล / Prepared By</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: {formatDate(date)}</p>
              </div>
              <div className="signature-box">
                <p>ผู้มีอำนาจลงนาม / Authorized Signature</p>
                <div className="signature-line">
                  {companyProfile.signature && (
                    <img src={companyProfile.signature} alt="Signature stamp" className="signature-img" />
                  )}
                </div>
                <p>วันที่ / Date: {formatDate(date)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="signature-box">
                <p>ผู้รับสินค้า / บริการ / Customer Signature</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: ................................</p>
              </div>
              <div className="signature-box">
                <p>ผู้รับเงิน / Collector</p>
                <div className="signature-line"></div>
                <p>วันที่ / Date: ................................</p>
              </div>
              <div className="signature-box">
                <p>ผู้มีอำนาจลงนาม / Authorized Signature</p>
                <div className="signature-line">
                  {companyProfile.signature && (
                    <img src={companyProfile.signature} alt="Signature stamp" className="signature-img" />
                  )}
                </div>
                <p>วันที่ / Date: {formatDate(date)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
