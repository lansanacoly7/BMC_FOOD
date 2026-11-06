import React, { useMemo, useState } from 'react'
import { Printer, X } from 'lucide-react'
import type { KdsOrder, PaymentMethod } from '../types/kds'

interface TransactionsPageProps {
  orders: KdsOrder[]
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash: 'Espèces',
}

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

const isPaid = (order: KdsOrder) => order.paymentStatus === 'paid' || order.status === 'delivered'

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ orders }) => {
  const [method, setMethod] = useState<'all' | PaymentMethod>('all')
  const [selectedOrder, setSelectedOrder] = useState<KdsOrder | null>(null)

  const sorted = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  )

  const visible = method === 'all' ? sorted : sorted.filter((o) => o.paymentMethod === method)
  const total = visible.filter(isPaid).reduce((sum, o) => sum + o.totalAmount, 0)

  const exportCsv = () => {
    const rows = visible.map((o) =>
      [
        new Date(o.createdAt).toLocaleString('fr-FR'),
        `"${o.customerName}"`,
        METHOD_LABELS[o.paymentMethod],
        o.totalAmount,
        isPaid(o) ? 'Payé' : 'En attente',
      ].join(';'),
    )
    const csv = ['Date;Client;Paiement;Montant;Statut', ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handlePrint = (order: KdsOrder) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600')
    if (!printWindow) return

    const itemsHtml = order.items
      .map(
        (i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
          <span>${i.quantity}x ${i.name}</span>
          <span>${(i.unitPrice * i.quantity).toLocaleString('fr-FR')} F</span>
        </div>
      `,
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu #${order.orderRef}</title>
          <style>
            body { font-family: monospace; width: 280px; margin: 0 auto; padding: 12px; color: #000; }
            h2 { text-align: center; margin: 4px 0; font-size: 18px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <h2>BMC FOOD DAKAR</h2>
          <div style="text-align:center; font-size:12px;">Ticket de Transaction</div>
          <div class="divider"></div>
          <div>Réf : <strong>${order.orderRef}</strong></div>
          <div>Date : ${new Date(order.createdAt).toLocaleString('fr-FR')}</div>
          <div>Client : ${order.customerName}</div>
          <div>Tél : ${order.phone}</div>
          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div class="total">
            <span>TOTAL :</span>
            <span>${order.totalAmount.toLocaleString('fr-FR')} F CFA</span>
          </div>
          <div style="font-size:12px; margin-top:4px;">Paiement : ${METHOD_LABELS[order.paymentMethod]} (${isPaid(order) ? 'Payé' : 'En attente'})</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const filterClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
      active ? 'bg-[#1A1E24] text-white font-semibold' : 'text-[#8A93A0] hover:text-white'
    }`

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 text-left">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-sm text-[#8A93A0]">Total encaissé</p>
          <p className="text-2xl font-semibold text-white mt-1">{formatPrice(total)}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="text-sm text-[#8A93A0] hover:text-white disabled:opacity-40 cursor-pointer"
        >
          Exporter CSV
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        <button type="button" onClick={() => setMethod('all')} className={filterClass(method === 'all')}>
          Tout
        </button>
        {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((key) => (
          <button key={key} type="button" onClick={() => setMethod(key)} className={filterClass(method === key)}>
            {METHOD_LABELS[key]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[#5F6875] py-12 text-center">Aucune transaction pour le moment.</p>
      ) : (
        <div className="border border-[#1F242B] rounded-xl overflow-hidden bg-[#0F1216]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#5F6875] border-b border-[#1F242B] bg-[#12151A]">
                <th className="py-3 px-4 font-normal">Heure</th>
                <th className="py-3 px-4 font-normal">Réf</th>
                <th className="py-3 px-4 font-normal">Client</th>
                <th className="py-3 px-4 font-normal">Paiement</th>
                <th className="py-3 px-4 font-normal text-right">Montant</th>
                <th className="py-3 px-4 font-normal text-right">Statut</th>
                <th className="py-3 px-4 font-normal text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="border-b border-[#16191E] hover:bg-[#15191F] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-[#8A93A0]">
                    {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{order.orderRef}</td>
                  <td className="py-3 px-4 text-white">{order.customerName}</td>
                  <td className="py-3 px-4 text-[#C4CAD3]">{METHOD_LABELS[order.paymentMethod]}</td>
                  <td className="py-3 px-4 text-white text-right font-medium">{formatPrice(order.totalAmount)}</td>
                  <td className={`py-3 px-4 text-right font-medium ${isPaid(order) ? 'text-[#C4CAD3]' : 'text-[#F5B301]'}`}>
                    {isPaid(order) ? 'Payé' : 'En attente'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs text-[#8A93A0] hover:text-white underline">
                      Détails
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL : Détail complet de la transaction */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A313C] bg-[#12151A] p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[#1F242B] pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Détail Transaction #{selectedOrder.orderRef}
                </h3>
                <p className="text-xs text-[#8A93A0]">
                  {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-[#8A93A0] hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Infos client et règlement */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#0F1216] border border-[#1F242B] p-4 text-xs">
              <div>
                <span className="text-[#5F6875] block">Client</span>
                <span className="font-semibold text-white">{selectedOrder.customerName}</span>
                <span className="text-[#8A93A0] block mt-1">{selectedOrder.phone}</span>
                <span className="text-[#8A93A0] block truncate">{selectedOrder.address}</span>
              </div>
              <div>
                <span className="text-[#5F6875] block">Règlement</span>
                <span className="font-semibold text-white">{METHOD_LABELS[selectedOrder.paymentMethod]}</span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isPaid(selectedOrder)
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {isPaid(selectedOrder) ? 'Paiement confirmé' : 'Paiement en attente'}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <p className="text-[11px] text-[#8A93A0] mt-1 italic">Note : {selectedOrder.notes}</p>
                )}
              </div>
            </div>

            {/* Articles commandés */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#8A93A0] uppercase tracking-wider">
                Articles commandés ({selectedOrder.items?.length || 0})
              </span>
              <div className="rounded-xl border border-[#1F242B] bg-[#0F1216] divide-y divide-[#16191E] max-h-52 overflow-y-auto">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-white font-medium">
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && <span className="text-[#8A93A0] block text-[11px]">Note : {item.notes}</span>}
                      </div>
                      <span className="font-semibold text-[#C4CAD3] tabular-nums">
                        {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-[#5F6875]">Détail des articles non disponible</div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-[#1F242B] pt-4">
              <span className="text-sm font-semibold text-[#8A93A0]">Montant total</span>
              <span className="text-xl font-bold text-[#F5B301] tabular-nums">
                {selectedOrder.totalAmount.toLocaleString('fr-FR')} F CFA
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrint(selectedOrder)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1E24] hover:bg-[#252B35] border border-[#2A313C] py-2 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                <Printer className="size-4 text-[#8A93A0]" />
                <span>Imprimer ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-lg bg-[#F5B301] hover:bg-[#ffc32b] py-2 text-xs font-semibold text-black cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
