import React, { useMemo, useState } from 'react'
import { Download, Printer, Receipt } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyBlock,
  Modal,
  PageBody,
  Segmented,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  Toolbar,
  Tr,
  type SegmentOption,
} from '../components/ui/primitives'
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
  const paidOrders = visible.filter(isPaid)
  const total = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const pendingTotal = visible.reduce((sum, o) => sum + (isPaid(o) ? 0 : o.totalAmount), 0)
  const pendingCount = visible.length - paidOrders.length
  const averageBasket = paidOrders.length > 0 ? Math.round(total / paidOrders.length) : 0

  const methodOptions: SegmentOption<'all' | PaymentMethod>[] = [
    { id: 'all', label: 'Tout', count: sorted.length },
    ...(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((key) => ({
      id: key,
      label: METHOD_LABELS[key],
      count: sorted.filter((o) => o.paymentMethod === key).length,
    })),
  ]

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

  return (
    <PageBody>
      <StatGrid>
        <Stat label="Total encaissé" value={formatPrice(total)} hint={`${paidOrders.length} paiements reçus`} />
        <Stat label="En attente" value={formatPrice(pendingTotal)} hint={`${pendingCount} à encaisser`} />
        <Stat label="Panier moyen" value={formatPrice(averageBasket)} hint="Sur les paiements reçus" />
        <Stat label="Transactions" value={visible.length} hint="Hors commandes annulées" />
      </StatGrid>

      <Card className="overflow-hidden">
        <Toolbar>
          <Segmented label="Filtrer par moyen de paiement" options={methodOptions} value={method} onChange={setMethod} />
          <Button icon={Download} onClick={exportCsv} disabled={visible.length === 0} className="ml-auto">
            Exporter en CSV
          </Button>
        </Toolbar>

        {visible.length === 0 ? (
          <EmptyBlock
            icon={Receipt}
            title="Aucune transaction"
            description="Les paiements apparaîtront ici dès la première commande."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Heure</Th>
                  <Th>Référence</Th>
                  <Th>Client</Th>
                  <Th className="hidden md:table-cell">Paiement</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Montant</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <Tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer">
                    <Td className="tabular-nums text-ink-soft">
                      {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Td>
                    <Td className="font-semibold tabular-nums">
                      <button type="button" className="cursor-pointer hover:underline">
                        {order.orderRef}
                      </button>
                    </Td>
                    <Td>{order.customerName}</Td>
                    <Td className="hidden text-ink-soft md:table-cell">{METHOD_LABELS[order.paymentMethod]}</Td>
                    <Td>
                      <Badge tone={isPaid(order) ? 'ok' : 'warn'}>{isPaid(order) ? 'Payé' : 'En attente'}</Badge>
                    </Td>
                    <Td className="text-right font-display font-semibold tabular-nums">
                      {formatPrice(order.totalAmount)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {selectedOrder && (
        <Modal
          title={`Transaction ${selectedOrder.orderRef}`}
          description={new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
          onClose={() => setSelectedOrder(null)}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                Fermer
              </Button>
              <Button icon={Printer} onClick={() => handlePrint(selectedOrder)}>
                Imprimer le reçu
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="min-w-0">
              <p className="text-[13px] text-ink-soft">Client</p>
              <p className="mt-0.5 font-semibold">{selectedOrder.customerName}</p>
              <p className="text-ink-soft">{selectedOrder.phone}</p>
              <p className="truncate text-ink-soft">{selectedOrder.address}</p>
            </div>
            <div>
              <p className="text-[13px] text-ink-soft">Règlement</p>
              <p className="mt-0.5 font-semibold">{METHOD_LABELS[selectedOrder.paymentMethod]}</p>
              <div className="mt-1">
                <Badge tone={isPaid(selectedOrder) ? 'ok' : 'warn'}>
                  {isPaid(selectedOrder) ? 'Paiement confirmé' : 'Paiement en attente'}
                </Badge>
              </div>
            </div>
          </div>

          {selectedOrder.notes && (
            <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-sm text-ink-soft">{selectedOrder.notes}</p>
          )}

          <div className="mt-4 border-t border-line">
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">
                      {item.quantity} × {item.name}
                    </span>
                    {item.notes && <span className="block text-[13px] text-ink-soft">{item.notes}</span>}
                  </div>
                  <span className="shrink-0 tabular-nums text-ink-soft">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-3 text-sm text-ink-soft">Détail des articles non disponible.</p>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-3">
            <span className="text-sm font-semibold">Montant total</span>
            <span className="font-display text-2xl font-extrabold tabular-nums">
              {selectedOrder.totalAmount.toLocaleString('fr-FR')} F CFA
            </span>
          </div>
        </Modal>
      )}
    </PageBody>
  )
}
